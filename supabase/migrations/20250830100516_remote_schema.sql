

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."calculate_consent_compliance_score"("p_clinic_id" "uuid", "p_patient_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_score DECIMAL(3,2) := 0.00;
  v_total_fields INTEGER := 7; -- Total number of consent fields
  v_granted_fields INTEGER := 0;
BEGIN
  -- Count granted consent fields
  SELECT COUNT(*) INTO v_granted_fields
  FROM patient_consents pc
  WHERE pc.clinic_id = p_clinic_id 
    AND pc.patient_id = p_patient_id
    AND pc.withdrawal_date IS NULL
    AND (
      (pc.sms_consent = true) +
      (pc.email_consent = true) +
      (pc.data_processing_consent = true) +
      (pc.third_party_sharing_consent = true) +
      (pc.marketing_consent = true) +
      (pc.age_confirmed = true) +
      (pc.terms_accepted = true)
    );
  
  -- Calculate score as percentage
  v_score := ROUND((v_granted_fields::DECIMAL / v_total_fields), 2);
  
  RETURN v_score;
END;
$$;


ALTER FUNCTION "public"."calculate_consent_compliance_score"("p_clinic_id" "uuid", "p_patient_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_consent_compliance_score"("p_clinic_id" "uuid", "p_patient_id" "uuid") IS 'Calculates overall consent compliance score (0.00-1.00)';



CREATE OR REPLACE FUNCTION "public"."get_user_clinic_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT clinic_id 
    FROM clinic_users 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$;


ALTER FUNCTION "public"."get_user_clinic_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_consent_compliance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update compliance tracking
  PERFORM update_consent_compliance(NEW.clinic_id, NEW.patient_id);
  
  -- Log the change in audit log
  INSERT INTO consent_audit_log (
    clinic_id, patient_id, consent_id, change_type, field_name, old_value, new_value
  ) VALUES (
    NEW.clinic_id, NEW.patient_id, NEW.id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'consent_granted'
      WHEN TG_OP = 'UPDATE' THEN 'consent_updated'
      WHEN TG_OP = 'DELETE' THEN 'consent_deleted'
    END,
    NULL, NULL, NULL
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_update_consent_compliance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_consent_compliance"("p_clinic_id" "uuid", "p_patient_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_compliance_score DECIMAL(3,2);
  v_sms_compliance BOOLEAN;
  v_email_compliance BOOLEAN;
  v_data_processing_compliance BOOLEAN;
BEGIN
  -- Calculate compliance score
  v_compliance_score := calculate_consent_compliance_score(p_clinic_id, p_patient_id);
  
  -- Get individual compliance statuses
  SELECT 
    COALESCE(sms_consent, false) AND withdrawal_date IS NULL,
    COALESCE(email_consent, false) AND withdrawal_date IS NULL,
    COALESCE(data_processing_consent, false) AND withdrawal_date IS NULL
  INTO v_sms_compliance, v_email_compliance, v_data_processing_compliance
  FROM patient_consents pc
  WHERE pc.clinic_id = p_clinic_id AND pc.patient_id = p_patient_id
  ORDER BY pc.consent_date DESC
  LIMIT 1;
  
  -- Upsert compliance record
  INSERT INTO consent_compliance (
    clinic_id, patient_id, overall_compliance_score,
    sms_compliance, email_compliance, data_processing_compliance,
    last_compliance_check, next_compliance_check, consent_expiration_date
  ) VALUES (
    p_clinic_id, p_patient_id, v_compliance_score,
    v_sms_compliance, v_email_compliance, v_data_processing_compliance,
    NOW(), NOW() + INTERVAL '1 year', NOW() + INTERVAL '1 year'
  )
  ON CONFLICT (clinic_id, patient_id) DO UPDATE SET
    overall_compliance_score = EXCLUDED.overall_compliance_score,
    sms_compliance = EXCLUDED.sms_compliance,
    email_compliance = EXCLUDED.email_compliance,
    data_processing_compliance = EXCLUDED.data_processing_compliance,
    last_compliance_check = EXCLUDED.last_compliance_check,
    next_compliance_check = EXCLUDED.next_compliance_check,
    consent_expiration_date = EXCLUDED.consent_expiration_date,
    updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."update_consent_compliance"("p_clinic_id" "uuid", "p_patient_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_consent_compliance"("p_clinic_id" "uuid", "p_patient_id" "uuid") IS 'Updates compliance tracking when consent records change';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."analytics_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "date" "date" NOT NULL,
    "total_appointments" integer DEFAULT 0,
    "completed_appointments" integer DEFAULT 0,
    "no_shows" integer DEFAULT 0,
    "cancellations" integer DEFAULT 0,
    "sms_sent" integer DEFAULT 0,
    "sms_delivered" integer DEFAULT 0,
    "sms_responded" integer DEFAULT 0,
    "exercise_completions" integer DEFAULT 0,
    "patient_check_ins" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "patient_id" "uuid",
    "therapist_id" "uuid",
    "treatment_plan_id" "uuid",
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "appointment_type" character varying(100),
    "status" character varying(50) DEFAULT 'scheduled'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "no_show_reported_at" timestamp without time zone,
    "no_show_recovery_status" character varying(50) DEFAULT 'none'::character varying,
    CONSTRAINT "appointments_no_show_recovery_status_check" CHECK ((("no_show_recovery_status")::"text" = ANY ((ARRAY['none'::character varying, 'enrolled'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "campaign_id" character varying(100) NOT NULL,
    "status" character varying(50) DEFAULT 'active'::character varying,
    "enrolled_at" timestamp without time zone DEFAULT "now"(),
    "next_message_at" timestamp without time zone NOT NULL,
    "current_step" integer DEFAULT 1,
    "total_steps" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "campaign_enrollments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'paused'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."campaign_enrollments" OWNER TO "postgres";


COMMENT ON TABLE "public"."campaign_enrollments" IS 'Tracks patient enrollment in automated campaigns, including the 4-step no-show recovery sequence';



COMMENT ON COLUMN "public"."campaign_enrollments"."next_message_at" IS 'When the next message in the sequence should be sent';



COMMENT ON COLUMN "public"."campaign_enrollments"."current_step" IS 'Current step in the campaign sequence (1-4 for no-show recovery)';



COMMENT ON COLUMN "public"."campaign_enrollments"."metadata" IS 'Stores campaign-specific data including appointment_id, original_scheduled_at, clinic_name, patient_name, no_show_detected_at, and campaign_type for no-show recovery';



CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "name" character varying(255) NOT NULL,
    "type" character varying(100) NOT NULL,
    "status" character varying(50) DEFAULT 'draft'::character varying,
    "target_criteria" "jsonb" DEFAULT '{}'::"jsonb",
    "message_sequence" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinic_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "plan_id" "uuid",
    "stripe_subscription_id" character varying(255),
    "stripe_customer_id" character varying(255),
    "status" character varying(50) DEFAULT 'active'::character varying,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "customer_id" "text",
    "sms_subscription_item_id" "text",
    "trial_end" timestamp without time zone,
    "cancel_at_period_end" boolean DEFAULT false
);


ALTER TABLE "public"."clinic_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinic_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "user_id" "uuid",
    "role" character varying(50) DEFAULT 'therapist'::character varying NOT NULL,
    "specialization" character varying(100),
    "license_number" character varying(50),
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clinic_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20),
    "address" "text",
    "specialty" character varying(100),
    "timezone" character varying(50) DEFAULT 'America/New_York'::character varying,
    "business_hours" "jsonb" DEFAULT '{"friday": {"open": "08:00", "close": "17:00"}, "monday": {"open": "08:00", "close": "17:00"}, "sunday": {"closed": true}, "tuesday": {"open": "08:00", "close": "17:00"}, "saturday": {"closed": true}, "thursday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}}'::"jsonb",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clinics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "consent_id" "uuid" NOT NULL,
    "change_type" character varying(50) NOT NULL,
    "field_name" character varying(100),
    "old_value" "text",
    "new_value" "text",
    "change_reason" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "changed_by" "uuid",
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."consent_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."consent_audit_log" IS 'Audit trail for all consent changes and withdrawals';



CREATE TABLE IF NOT EXISTS "public"."consent_compliance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "overall_compliance_score" numeric(3,2) DEFAULT 0.00 NOT NULL,
    "sms_compliance" boolean DEFAULT false NOT NULL,
    "email_compliance" boolean DEFAULT false NOT NULL,
    "data_processing_compliance" boolean DEFAULT false NOT NULL,
    "last_compliance_check" timestamp with time zone DEFAULT "now"() NOT NULL,
    "next_compliance_check" timestamp with time zone DEFAULT ("now"() + '1 year'::interval) NOT NULL,
    "consent_expiration_date" timestamp with time zone DEFAULT ("now"() + '1 year'::interval) NOT NULL,
    "compliance_actions_required" "text"[],
    "compliance_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_compliance_dates" CHECK ((("next_compliance_check" > "last_compliance_check") AND ("consent_expiration_date" > "now"()))),
    CONSTRAINT "valid_compliance_score" CHECK ((("overall_compliance_score" >= 0.00) AND ("overall_compliance_score" <= 1.00)))
);


ALTER TABLE "public"."consent_compliance" OWNER TO "postgres";


COMMENT ON TABLE "public"."consent_compliance" IS 'Compliance tracking and scoring for consent management';



CREATE TABLE IF NOT EXISTS "public"."consent_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "sms_quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone,
    "sms_quiet_hours_end" time without time zone DEFAULT '08:00:00'::time without time zone,
    "sms_timezone" character varying(50) DEFAULT 'UTC'::character varying,
    "appointment_reminders" boolean DEFAULT true,
    "exercise_reminders" boolean DEFAULT true,
    "progress_checkins" boolean DEFAULT true,
    "no_show_recovery" boolean DEFAULT true,
    "treatment_updates" boolean DEFAULT true,
    "marketing_messages" boolean DEFAULT false,
    "max_sms_per_day" integer DEFAULT 3,
    "max_email_per_week" integer DEFAULT 2,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_frequency_limits" CHECK (((("max_sms_per_day" >= 1) AND ("max_sms_per_day" <= 10)) AND (("max_email_per_week" >= 1) AND ("max_email_per_week" <= 7)))),
    CONSTRAINT "valid_quiet_hours" CHECK (("sms_quiet_hours_start" < "sms_quiet_hours_end"))
);


ALTER TABLE "public"."consent_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."consent_preferences" IS 'Granular communication preferences for consented patients';



CREATE TABLE IF NOT EXISTS "public"."exercise_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "patient_id" "uuid",
    "patient_exercise_id" "uuid",
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "duration_minutes" integer,
    "difficulty_rating" integer,
    "pain_level_before" integer,
    "pain_level_after" integer,
    "notes" "text",
    "compliance_score" numeric(3,2) DEFAULT 1.00,
    CONSTRAINT "exercise_completions_compliance_score_check" CHECK ((("compliance_score" >= (0)::numeric) AND ("compliance_score" <= (1)::numeric))),
    CONSTRAINT "exercise_completions_difficulty_rating_check" CHECK ((("difficulty_rating" >= 1) AND ("difficulty_rating" <= 5))),
    CONSTRAINT "exercise_completions_pain_level_after_check" CHECK ((("pain_level_after" >= 0) AND ("pain_level_after" <= 10))),
    CONSTRAINT "exercise_completions_pain_level_before_check" CHECK ((("pain_level_before" >= 0) AND ("pain_level_before" <= 10)))
);


ALTER TABLE "public"."exercise_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "name" character varying(255) NOT NULL,
    "condition_type" character varying(100),
    "exercises" "jsonb" DEFAULT '[]'::"jsonb",
    "frequency" character varying(50),
    "duration_weeks" integer DEFAULT 6,
    "difficulty_level" integer DEFAULT 1,
    "instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "exercise_programs_difficulty_level_check" CHECK ((("difficulty_level" >= 1) AND ("difficulty_level" <= 5)))
);


ALTER TABLE "public"."exercise_programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "campaign_id" "uuid",
    "patient_id" "uuid",
    "appointment_id" "uuid",
    "template_id" "uuid",
    "message_type" character varying(50) NOT NULL,
    "content" "text" NOT NULL,
    "recipient" character varying(255) NOT NULL,
    "status" character varying(50) NOT NULL,
    "twilio_sid" character varying(255),
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "delivered_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "response_text" "text",
    "response_at" timestamp with time zone,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."message_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."message_logs" IS 'Logs all SMS messages sent, including system messages for no-show detection and recovery sequence tracking';



COMMENT ON COLUMN "public"."message_logs"."metadata" IS 'Stores message-specific metadata including message_key for idempotency, no_show_step for recovery sequence, and other tracking information';



CREATE TABLE IF NOT EXISTS "public"."message_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "name" character varying(255) NOT NULL,
    "category" character varying(100),
    "treatment_type" character varying(100),
    "content" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "send_conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_compliance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "patient_id" "uuid",
    "treatment_plan_id" "uuid",
    "appointment_compliance_rate" numeric(5,2),
    "exercise_compliance_rate" numeric(5,2),
    "communication_response_rate" numeric(5,2),
    "progress_score" integer,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "patient_compliance_progress_score_check" CHECK ((("progress_score" >= 0) AND ("progress_score" <= 100)))
);


ALTER TABLE "public"."patient_compliance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "sms_consent" boolean DEFAULT false NOT NULL,
    "email_consent" boolean DEFAULT false NOT NULL,
    "data_processing_consent" boolean DEFAULT false NOT NULL,
    "third_party_sharing_consent" boolean DEFAULT false NOT NULL,
    "marketing_consent" boolean DEFAULT false NOT NULL,
    "age_confirmed" boolean DEFAULT false NOT NULL,
    "terms_accepted" boolean DEFAULT false NOT NULL,
    "consent_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consent_version" character varying(20) DEFAULT '1.0'::character varying NOT NULL,
    "consent_source" character varying(50) DEFAULT 'web_form'::character varying NOT NULL,
    "withdrawal_date" timestamp with time zone,
    "withdrawal_reason" "text",
    "withdrawal_method" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "valid_consent_dates" CHECK ((("withdrawal_date" IS NULL) OR ("withdrawal_date" >= "consent_date"))),
    CONSTRAINT "valid_consent_version" CHECK ((("consent_version")::"text" ~ '^[0-9]+\.[0-9]+$'::"text"))
);


ALTER TABLE "public"."patient_consents" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_consents" IS 'Stores patient consent records for HIPAA, GDPR, and TCPA compliance';



CREATE TABLE IF NOT EXISTS "public"."patient_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "patient_id" "uuid",
    "treatment_plan_id" "uuid",
    "exercise_program_id" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "start_date" "date",
    "target_completion_date" "date",
    "status" character varying(50) DEFAULT 'active'::character varying,
    "modifications" "text",
    "therapist_notes" "text"
);


ALTER TABLE "public"."patient_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "patient_id" "uuid",
    "treatment_plan_id" "uuid",
    "assessment_date" "date",
    "pain_level" integer,
    "functional_score" integer,
    "range_of_motion" "jsonb",
    "strength_score" integer,
    "notes" "text",
    "therapist_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "patient_progress_pain_level_check" CHECK ((("pain_level" >= 0) AND ("pain_level" <= 10)))
);


ALTER TABLE "public"."patient_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "email" character varying(255),
    "phone" character varying(20) NOT NULL,
    "date_of_birth" "date",
    "gender" character varying(20),
    "address" "text",
    "emergency_contact" "jsonb",
    "primary_condition" character varying(255),
    "injury_date" "date",
    "referral_source" character varying(100),
    "insurance_info" "jsonb",
    "goals" "text",
    "medical_history" "text",
    "opt_in_sms" boolean DEFAULT true,
    "opt_in_email" boolean DEFAULT true,
    "sms_consent_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "price_monthly" numeric(10,2) NOT NULL,
    "sms_included" integer NOT NULL,
    "max_patients" integer,
    "max_therapists" integer,
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treatment_outcomes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "patient_id" "uuid",
    "treatment_plan_id" "uuid",
    "initial_pain_level" integer,
    "final_pain_level" integer,
    "initial_function_score" integer,
    "final_function_score" integer,
    "treatment_satisfaction" integer,
    "goals_achieved" boolean DEFAULT false,
    "completion_date" "date",
    "total_sessions" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "treatment_outcomes_final_pain_level_check" CHECK ((("final_pain_level" >= 0) AND ("final_pain_level" <= 10))),
    CONSTRAINT "treatment_outcomes_initial_pain_level_check" CHECK ((("initial_pain_level" >= 0) AND ("initial_pain_level" <= 10))),
    CONSTRAINT "treatment_outcomes_treatment_satisfaction_check" CHECK ((("treatment_satisfaction" >= 1) AND ("treatment_satisfaction" <= 5)))
);


ALTER TABLE "public"."treatment_outcomes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treatment_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "patient_id" "uuid",
    "therapist_id" "uuid",
    "condition" character varying(255) NOT NULL,
    "treatment_type" character varying(100),
    "goals" "text",
    "frequency_per_week" integer DEFAULT 2,
    "estimated_duration_weeks" integer DEFAULT 6,
    "start_date" "date",
    "end_date" "date",
    "status" character varying(50) DEFAULT 'active'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatment_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "date" "date" NOT NULL,
    "sms_sent" integer DEFAULT 0,
    "emails_sent" integer DEFAULT 0,
    "api_calls" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "first_name" character varying(100),
    "last_name" character varying(100),
    "phone" character varying(20),
    "credentials" character varying(100),
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."analytics_daily"
    ADD CONSTRAINT "analytics_daily_clinic_id_date_key" UNIQUE ("clinic_id", "date");



ALTER TABLE ONLY "public"."analytics_daily"
    ADD CONSTRAINT "analytics_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_enrollments"
    ADD CONSTRAINT "campaign_enrollments_clinic_id_patient_id_campaign_id_key" UNIQUE ("clinic_id", "patient_id", "campaign_id");



ALTER TABLE ONLY "public"."campaign_enrollments"
    ADD CONSTRAINT "campaign_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinic_subscriptions"
    ADD CONSTRAINT "clinic_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinic_users"
    ADD CONSTRAINT "clinic_users_clinic_id_user_id_key" UNIQUE ("clinic_id", "user_id");



ALTER TABLE ONLY "public"."clinic_users"
    ADD CONSTRAINT "clinic_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinics"
    ADD CONSTRAINT "clinics_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."clinics"
    ADD CONSTRAINT "clinics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinics"
    ADD CONSTRAINT "clinics_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."consent_audit_log"
    ADD CONSTRAINT "consent_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_compliance"
    ADD CONSTRAINT "consent_compliance_clinic_id_patient_id_key" UNIQUE ("clinic_id", "patient_id");



ALTER TABLE ONLY "public"."consent_compliance"
    ADD CONSTRAINT "consent_compliance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_preferences"
    ADD CONSTRAINT "consent_preferences_clinic_id_patient_id_key" UNIQUE ("clinic_id", "patient_id");



ALTER TABLE ONLY "public"."consent_preferences"
    ADD CONSTRAINT "consent_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_completions"
    ADD CONSTRAINT "exercise_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_programs"
    ADD CONSTRAINT "exercise_programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_compliance"
    ADD CONSTRAINT "patient_compliance_patient_id_treatment_plan_id_key" UNIQUE ("patient_id", "treatment_plan_id");



ALTER TABLE ONLY "public"."patient_compliance"
    ADD CONSTRAINT "patient_compliance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_consents"
    ADD CONSTRAINT "patient_consents_clinic_id_patient_id_consent_version_key" UNIQUE ("clinic_id", "patient_id", "consent_version");



ALTER TABLE ONLY "public"."patient_consents"
    ADD CONSTRAINT "patient_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_exercises"
    ADD CONSTRAINT "patient_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_progress"
    ADD CONSTRAINT "patient_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_outcomes"
    ADD CONSTRAINT "treatment_outcomes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_plans"
    ADD CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "unique_campaign_message" UNIQUE ("campaign_id", "patient_id", "appointment_id");



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_clinic_id_date_key" UNIQUE ("clinic_id", "date");



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_analytics_daily_clinic_date" ON "public"."analytics_daily" USING "btree" ("clinic_id", "date");



CREATE INDEX "idx_appointments_clinic_id" ON "public"."appointments" USING "btree" ("clinic_id");



CREATE INDEX "idx_appointments_no_show_detection" ON "public"."appointments" USING "btree" ("status", "scheduled_at") WHERE (("status")::"text" = 'scheduled'::"text");



CREATE INDEX "idx_appointments_patient_id" ON "public"."appointments" USING "btree" ("patient_id");



CREATE INDEX "idx_appointments_scheduled_at" ON "public"."appointments" USING "btree" ("scheduled_at");



CREATE INDEX "idx_appointments_status" ON "public"."appointments" USING "btree" ("status");



CREATE INDEX "idx_appointments_status_scheduled_at" ON "public"."appointments" USING "btree" ("status", "scheduled_at") WHERE (("status")::"text" = 'scheduled'::"text");



CREATE INDEX "idx_appointments_therapist_id" ON "public"."appointments" USING "btree" ("therapist_id");



CREATE INDEX "idx_campaign_enrollments_active" ON "public"."campaign_enrollments" USING "btree" ("clinic_id", "campaign_id", "status", "next_message_at");



CREATE INDEX "idx_campaign_enrollments_no_show_recovery" ON "public"."campaign_enrollments" USING "btree" ("clinic_id", "status", "next_message_at") WHERE ((("metadata" ->> 'campaign_type'::"text") = 'no_show_recovery'::"text") AND (("status")::"text" = 'active'::"text"));



CREATE INDEX "idx_campaign_enrollments_patient" ON "public"."campaign_enrollments" USING "btree" ("patient_id", "campaign_id", "status");



CREATE INDEX "idx_clinic_subscriptions_customer" ON "public"."clinic_subscriptions" USING "btree" ("customer_id");



CREATE INDEX "idx_clinic_users_clinic_id" ON "public"."clinic_users" USING "btree" ("clinic_id");



CREATE INDEX "idx_clinic_users_role" ON "public"."clinic_users" USING "btree" ("role");



CREATE INDEX "idx_clinic_users_user_id" ON "public"."clinic_users" USING "btree" ("user_id");



CREATE INDEX "idx_exercise_completions_clinic_id" ON "public"."exercise_completions" USING "btree" ("clinic_id");



CREATE INDEX "idx_exercise_completions_completed_at" ON "public"."exercise_completions" USING "btree" ("completed_at");



CREATE INDEX "idx_exercise_completions_patient_id" ON "public"."exercise_completions" USING "btree" ("patient_id");



CREATE INDEX "idx_message_logs_campaign" ON "public"."message_logs" USING "btree" ("campaign_id", "patient_id", "appointment_id");



CREATE INDEX "idx_message_logs_clinic_id" ON "public"."message_logs" USING "btree" ("clinic_id");



CREATE INDEX "idx_message_logs_no_show_detection" ON "public"."message_logs" USING "btree" ("clinic_id", "appointment_id") WHERE (("metadata" ->> 'no_show_detected'::"text") = 'true'::"text");



CREATE INDEX "idx_message_logs_no_show_recovery_step" ON "public"."message_logs" USING "btree" ("clinic_id", "patient_id", "appointment_id") WHERE (("metadata" ->> 'campaign_type'::"text") = 'no_show_recovery'::"text");



CREATE INDEX "idx_message_logs_patient_id" ON "public"."message_logs" USING "btree" ("patient_id");



CREATE INDEX "idx_message_logs_sent_at" ON "public"."message_logs" USING "btree" ("sent_at");



CREATE INDEX "idx_message_logs_status" ON "public"."message_logs" USING "btree" ("status");



CREATE INDEX "idx_message_logs_twilio_sid" ON "public"."message_logs" USING "btree" ("twilio_sid");



CREATE INDEX "idx_message_templates_active" ON "public"."message_templates" USING "btree" ("is_active");



CREATE INDEX "idx_message_templates_category" ON "public"."message_templates" USING "btree" ("category");



CREATE INDEX "idx_message_templates_clinic_id" ON "public"."message_templates" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_compliance_clinic_id" ON "public"."patient_compliance" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_exercises_clinic_id" ON "public"."patient_exercises" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_exercises_patient_id" ON "public"."patient_exercises" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_exercises_status" ON "public"."patient_exercises" USING "btree" ("status");



CREATE INDEX "idx_patients_clinic_id" ON "public"."patients" USING "btree" ("clinic_id");



CREATE INDEX "idx_patients_email" ON "public"."patients" USING "btree" ("email");



CREATE INDEX "idx_patients_phone" ON "public"."patients" USING "btree" ("phone");



CREATE INDEX "idx_treatment_outcomes_clinic_id" ON "public"."treatment_outcomes" USING "btree" ("clinic_id");



CREATE INDEX "idx_treatment_plans_clinic_id" ON "public"."treatment_plans" USING "btree" ("clinic_id");



CREATE INDEX "idx_treatment_plans_patient_id" ON "public"."treatment_plans" USING "btree" ("patient_id");



CREATE INDEX "idx_treatment_plans_status" ON "public"."treatment_plans" USING "btree" ("status");



CREATE INDEX "idx_usage_logs_clinic_date" ON "public"."usage_logs" USING "btree" ("clinic_id", "date");



CREATE INDEX "ix_appts_clinic_sched" ON "public"."appointments" USING "btree" ("clinic_id", "scheduled_at");



CREATE INDEX "ix_clinic_subscriptions_clinic" ON "public"."clinic_subscriptions" USING "btree" ("clinic_id");



CREATE INDEX "ix_clinic_users_clinic" ON "public"."clinic_users" USING "btree" ("clinic_id");



CREATE INDEX "ix_consent_audit_log_changed_at" ON "public"."consent_audit_log" USING "btree" ("changed_at");



CREATE INDEX "ix_consent_audit_log_clinic_id" ON "public"."consent_audit_log" USING "btree" ("clinic_id");



CREATE INDEX "ix_consent_audit_log_consent_id" ON "public"."consent_audit_log" USING "btree" ("consent_id");



CREATE INDEX "ix_consent_audit_log_patient_id" ON "public"."consent_audit_log" USING "btree" ("patient_id");



CREATE INDEX "ix_consent_compliance_clinic_id" ON "public"."consent_compliance" USING "btree" ("clinic_id");



CREATE INDEX "ix_consent_compliance_expiration" ON "public"."consent_compliance" USING "btree" ("consent_expiration_date");



CREATE INDEX "ix_consent_compliance_patient_id" ON "public"."consent_compliance" USING "btree" ("patient_id");



CREATE INDEX "ix_consent_compliance_score" ON "public"."consent_compliance" USING "btree" ("overall_compliance_score");



CREATE INDEX "ix_consent_preferences_clinic_id" ON "public"."consent_preferences" USING "btree" ("clinic_id");



CREATE INDEX "ix_consent_preferences_patient_id" ON "public"."consent_preferences" USING "btree" ("patient_id");



CREATE INDEX "ix_patient_consents_clinic_id" ON "public"."patient_consents" USING "btree" ("clinic_id");



CREATE INDEX "ix_patient_consents_consent_date" ON "public"."patient_consents" USING "btree" ("consent_date");



CREATE INDEX "ix_patient_consents_email_consent" ON "public"."patient_consents" USING "btree" ("email_consent") WHERE ("email_consent" = true);



CREATE INDEX "ix_patient_consents_patient_id" ON "public"."patient_consents" USING "btree" ("patient_id");



CREATE INDEX "ix_patient_consents_sms_consent" ON "public"."patient_consents" USING "btree" ("sms_consent") WHERE ("sms_consent" = true);



CREATE INDEX "ix_patient_consents_withdrawal_date" ON "public"."patient_consents" USING "btree" ("withdrawal_date");



CREATE INDEX "ix_patients_clinic" ON "public"."patients" USING "btree" ("clinic_id");



CREATE UNIQUE INDEX "ux_msg_unique_reminder" ON "public"."message_logs" USING "btree" ("clinic_id", "appointment_id", "template_id");



CREATE OR REPLACE TRIGGER "trigger_consent_compliance_update" AFTER INSERT OR DELETE OR UPDATE ON "public"."patient_consents" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_consent_compliance"();



CREATE OR REPLACE TRIGGER "update_appointments_updated_at" BEFORE UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_campaign_enrollments_updated_at" BEFORE UPDATE ON "public"."campaign_enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_campaigns_updated_at" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clinic_subscriptions_updated_at" BEFORE UPDATE ON "public"."clinic_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clinic_users_updated_at" BEFORE UPDATE ON "public"."clinic_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clinics_updated_at" BEFORE UPDATE ON "public"."clinics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_exercise_programs_updated_at" BEFORE UPDATE ON "public"."exercise_programs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_message_templates_updated_at" BEFORE UPDATE ON "public"."message_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_patients_updated_at" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_treatment_plans_updated_at" BEFORE UPDATE ON "public"."treatment_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."analytics_daily"
    ADD CONSTRAINT "analytics_daily_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "public"."clinic_users"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_treatment_plan_id_fkey" FOREIGN KEY ("treatment_plan_id") REFERENCES "public"."treatment_plans"("id");



ALTER TABLE ONLY "public"."campaign_enrollments"
    ADD CONSTRAINT "campaign_enrollments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_enrollments"
    ADD CONSTRAINT "campaign_enrollments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinic_subscriptions"
    ADD CONSTRAINT "clinic_subscriptions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinic_subscriptions"
    ADD CONSTRAINT "clinic_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."clinic_users"
    ADD CONSTRAINT "clinic_users_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinic_users"
    ADD CONSTRAINT "clinic_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_audit_log"
    ADD CONSTRAINT "consent_audit_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."consent_audit_log"
    ADD CONSTRAINT "consent_audit_log_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_audit_log"
    ADD CONSTRAINT "consent_audit_log_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "public"."patient_consents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_audit_log"
    ADD CONSTRAINT "consent_audit_log_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_compliance"
    ADD CONSTRAINT "consent_compliance_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_compliance"
    ADD CONSTRAINT "consent_compliance_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_preferences"
    ADD CONSTRAINT "consent_preferences_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_preferences"
    ADD CONSTRAINT "consent_preferences_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_completions"
    ADD CONSTRAINT "exercise_completions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_completions"
    ADD CONSTRAINT "exercise_completions_patient_exercise_id_fkey" FOREIGN KEY ("patient_exercise_id") REFERENCES "public"."patient_exercises"("id");



ALTER TABLE ONLY "public"."exercise_completions"
    ADD CONSTRAINT "exercise_completions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_programs"
    ADD CONSTRAINT "exercise_programs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_compliance"
    ADD CONSTRAINT "patient_compliance_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_compliance"
    ADD CONSTRAINT "patient_compliance_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_compliance"
    ADD CONSTRAINT "patient_compliance_treatment_plan_id_fkey" FOREIGN KEY ("treatment_plan_id") REFERENCES "public"."treatment_plans"("id");



ALTER TABLE ONLY "public"."patient_consents"
    ADD CONSTRAINT "patient_consents_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_consents"
    ADD CONSTRAINT "patient_consents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."patient_consents"
    ADD CONSTRAINT "patient_consents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_consents"
    ADD CONSTRAINT "patient_consents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."patient_exercises"
    ADD CONSTRAINT "patient_exercises_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_exercises"
    ADD CONSTRAINT "patient_exercises_exercise_program_id_fkey" FOREIGN KEY ("exercise_program_id") REFERENCES "public"."exercise_programs"("id");



ALTER TABLE ONLY "public"."patient_exercises"
    ADD CONSTRAINT "patient_exercises_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_exercises"
    ADD CONSTRAINT "patient_exercises_treatment_plan_id_fkey" FOREIGN KEY ("treatment_plan_id") REFERENCES "public"."treatment_plans"("id");



ALTER TABLE ONLY "public"."patient_progress"
    ADD CONSTRAINT "patient_progress_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_progress"
    ADD CONSTRAINT "patient_progress_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_progress"
    ADD CONSTRAINT "patient_progress_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "public"."clinic_users"("id");



ALTER TABLE ONLY "public"."patient_progress"
    ADD CONSTRAINT "patient_progress_treatment_plan_id_fkey" FOREIGN KEY ("treatment_plan_id") REFERENCES "public"."treatment_plans"("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_outcomes"
    ADD CONSTRAINT "treatment_outcomes_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_outcomes"
    ADD CONSTRAINT "treatment_outcomes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_outcomes"
    ADD CONSTRAINT "treatment_outcomes_treatment_plan_id_fkey" FOREIGN KEY ("treatment_plan_id") REFERENCES "public"."treatment_plans"("id");



ALTER TABLE ONLY "public"."treatment_plans"
    ADD CONSTRAINT "treatment_plans_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_plans"
    ADD CONSTRAINT "treatment_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_plans"
    ADD CONSTRAINT "treatment_plans_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "public"."clinic_users"("id");



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow clinic operations" ON "public"."clinics" USING (("id" IN ( SELECT "clinic_users"."clinic_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."user_id" = "auth"."uid"())))) WITH CHECK ((NOT (EXISTS ( SELECT 1
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow clinic user operations" ON "public"."clinic_users" USING (("clinic_id" IN ( SELECT "clinic_users_1"."clinic_id"
   FROM "public"."clinic_users" "clinic_users_1"
  WHERE ("clinic_users_1"."user_id" = "auth"."uid"())))) WITH CHECK ((NOT (EXISTS ( SELECT 1
   FROM "public"."clinic_users" "clinic_users_1"
  WHERE ("clinic_users_1"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow profile operations" ON "public"."user_profiles" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Service role can access all enrollments" ON "public"."campaign_enrollments" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can access consent audit logs for their clinic" ON "public"."consent_audit_log" USING (("clinic_id" IN ( SELECT "clinic_users"."clinic_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can access consent compliance for their clinic" ON "public"."consent_compliance" USING (("clinic_id" IN ( SELECT "clinic_users"."clinic_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can access consent preferences for their clinic" ON "public"."consent_preferences" USING (("clinic_id" IN ( SELECT "clinic_users"."clinic_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can access consent records for their clinic" ON "public"."patient_consents" USING (("clinic_id" IN ( SELECT "clinic_users"."clinic_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can only access enrollments for their own clinic" ON "public"."campaign_enrollments" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "campaign_enrollments"."clinic_id"))));



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clinic_members" ON "public"."clinics" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "clinic_users"."id"))));



CREATE POLICY "clinic_members_appts" ON "public"."appointments" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "appointments"."clinic_id"))));



CREATE POLICY "clinic_members_campaigns" ON "public"."campaigns" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "campaigns"."clinic_id"))));



CREATE POLICY "clinic_members_excomp" ON "public"."exercise_completions" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "exercise_completions"."clinic_id"))));



CREATE POLICY "clinic_members_exprog" ON "public"."exercise_programs" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "exercise_programs"."clinic_id"))));



CREATE POLICY "clinic_members_msglogs" ON "public"."message_logs" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "message_logs"."clinic_id"))));



CREATE POLICY "clinic_members_patients" ON "public"."patients" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "patients"."clinic_id"))));



CREATE POLICY "clinic_members_pex" ON "public"."patient_exercises" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "patient_exercises"."clinic_id"))));



CREATE POLICY "clinic_members_progress" ON "public"."patient_progress" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "patient_progress"."clinic_id"))));



CREATE POLICY "clinic_members_templates" ON "public"."message_templates" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "message_templates"."clinic_id"))));



CREATE POLICY "clinic_members_tp" ON "public"."treatment_plans" USING (("auth"."uid"() IN ( SELECT "clinic_users"."user_id"
   FROM "public"."clinic_users"
  WHERE ("clinic_users"."clinic_id" = "treatment_plans"."clinic_id"))));



ALTER TABLE "public"."clinics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consent_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consent_compliance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consent_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_programs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treatment_plans" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "anon";








































































































































































GRANT ALL ON TABLE "public"."analytics_daily" TO "authenticated";



GRANT ALL ON TABLE "public"."appointments" TO "authenticated";



GRANT ALL ON TABLE "public"."campaign_enrollments" TO "authenticated";



GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";



GRANT ALL ON TABLE "public"."clinic_subscriptions" TO "authenticated";



GRANT ALL ON TABLE "public"."clinic_users" TO "authenticated";



GRANT ALL ON TABLE "public"."clinics" TO "authenticated";



GRANT ALL ON TABLE "public"."consent_audit_log" TO "authenticated";



GRANT ALL ON TABLE "public"."consent_compliance" TO "authenticated";



GRANT ALL ON TABLE "public"."consent_preferences" TO "authenticated";



GRANT ALL ON TABLE "public"."exercise_completions" TO "authenticated";



GRANT ALL ON TABLE "public"."exercise_programs" TO "authenticated";



GRANT ALL ON TABLE "public"."message_logs" TO "authenticated";



GRANT ALL ON TABLE "public"."message_templates" TO "authenticated";



GRANT ALL ON TABLE "public"."patient_compliance" TO "authenticated";



GRANT ALL ON TABLE "public"."patient_consents" TO "authenticated";



GRANT ALL ON TABLE "public"."patient_exercises" TO "authenticated";



GRANT ALL ON TABLE "public"."patient_progress" TO "authenticated";



GRANT ALL ON TABLE "public"."patients" TO "authenticated";



GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";



GRANT ALL ON TABLE "public"."treatment_outcomes" TO "authenticated";



GRANT ALL ON TABLE "public"."treatment_plans" TO "authenticated";



GRANT ALL ON TABLE "public"."usage_logs" TO "authenticated";



GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";



























RESET ALL;
