drop policy "clinic_members_appts" on "public"."appointments";

drop policy "clinic_members_campaigns" on "public"."campaigns";

drop policy "Allow clinic user operations" on "public"."clinic_users";

drop policy "Allow clinic operations" on "public"."clinics";

drop policy "clinic_members" on "public"."clinics";

drop policy "clinic_members_excomp" on "public"."exercise_completions";

drop policy "clinic_members_exprog" on "public"."exercise_programs";

drop policy "clinic_members_msglogs" on "public"."message_logs";

drop policy "clinic_members_templates" on "public"."message_templates";

drop policy "clinic_members_pex" on "public"."patient_exercises";

drop policy "clinic_members_progress" on "public"."patient_progress";

drop policy "clinic_members_patients" on "public"."patients";

drop policy "clinic_members_tp" on "public"."treatment_plans";

alter table "public"."appointments" drop constraint "appointments_no_show_recovery_status_check";

alter table "public"."campaign_enrollments" drop constraint "campaign_enrollments_status_check";

alter table "public"."consent_preferences" drop constraint "valid_frequency_limits";

alter table "public"."appointments" add constraint "appointments_no_show_recovery_status_check" CHECK (((no_show_recovery_status)::text = ANY ((ARRAY['none'::character varying, 'enrolled'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."appointments" validate constraint "appointments_no_show_recovery_status_check";

alter table "public"."campaign_enrollments" add constraint "campaign_enrollments_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'paused'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."campaign_enrollments" validate constraint "campaign_enrollments_status_check";

alter table "public"."consent_preferences" add constraint "valid_frequency_limits" CHECK ((((max_sms_per_day >= 1) AND (max_sms_per_day <= 10)) AND ((max_email_per_week >= 1) AND (max_email_per_week <= 7)))) not valid;

alter table "public"."consent_preferences" validate constraint "valid_frequency_limits";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_service_role()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    auth.role() = 'service_role'
    OR
    (auth.jwt() ->> 'role') = 'service_role'
    OR
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );
END;
$function$
;

grant delete on table "public"."analytics_daily" to "service_role";

grant insert on table "public"."analytics_daily" to "service_role";

grant references on table "public"."analytics_daily" to "service_role";

grant select on table "public"."analytics_daily" to "service_role";

grant trigger on table "public"."analytics_daily" to "service_role";

grant truncate on table "public"."analytics_daily" to "service_role";

grant update on table "public"."analytics_daily" to "service_role";

grant delete on table "public"."appointments" to "service_role";

grant insert on table "public"."appointments" to "service_role";

grant references on table "public"."appointments" to "service_role";

grant select on table "public"."appointments" to "service_role";

grant trigger on table "public"."appointments" to "service_role";

grant truncate on table "public"."appointments" to "service_role";

grant update on table "public"."appointments" to "service_role";

grant delete on table "public"."campaign_enrollments" to "service_role";

grant insert on table "public"."campaign_enrollments" to "service_role";

grant references on table "public"."campaign_enrollments" to "service_role";

grant select on table "public"."campaign_enrollments" to "service_role";

grant trigger on table "public"."campaign_enrollments" to "service_role";

grant truncate on table "public"."campaign_enrollments" to "service_role";

grant update on table "public"."campaign_enrollments" to "service_role";

grant delete on table "public"."campaigns" to "service_role";

grant insert on table "public"."campaigns" to "service_role";

grant references on table "public"."campaigns" to "service_role";

grant select on table "public"."campaigns" to "service_role";

grant trigger on table "public"."campaigns" to "service_role";

grant truncate on table "public"."campaigns" to "service_role";

grant update on table "public"."campaigns" to "service_role";

grant delete on table "public"."clinic_subscriptions" to "service_role";

grant insert on table "public"."clinic_subscriptions" to "service_role";

grant references on table "public"."clinic_subscriptions" to "service_role";

grant select on table "public"."clinic_subscriptions" to "service_role";

grant trigger on table "public"."clinic_subscriptions" to "service_role";

grant truncate on table "public"."clinic_subscriptions" to "service_role";

grant update on table "public"."clinic_subscriptions" to "service_role";

grant delete on table "public"."clinic_users" to "service_role";

grant insert on table "public"."clinic_users" to "service_role";

grant references on table "public"."clinic_users" to "service_role";

grant select on table "public"."clinic_users" to "service_role";

grant trigger on table "public"."clinic_users" to "service_role";

grant truncate on table "public"."clinic_users" to "service_role";

grant update on table "public"."clinic_users" to "service_role";

grant delete on table "public"."clinics" to "service_role";

grant insert on table "public"."clinics" to "service_role";

grant references on table "public"."clinics" to "service_role";

grant select on table "public"."clinics" to "service_role";

grant trigger on table "public"."clinics" to "service_role";

grant truncate on table "public"."clinics" to "service_role";

grant update on table "public"."clinics" to "service_role";

grant delete on table "public"."consent_audit_log" to "service_role";

grant insert on table "public"."consent_audit_log" to "service_role";

grant references on table "public"."consent_audit_log" to "service_role";

grant select on table "public"."consent_audit_log" to "service_role";

grant trigger on table "public"."consent_audit_log" to "service_role";

grant truncate on table "public"."consent_audit_log" to "service_role";

grant update on table "public"."consent_audit_log" to "service_role";

grant delete on table "public"."consent_compliance" to "service_role";

grant insert on table "public"."consent_compliance" to "service_role";

grant references on table "public"."consent_compliance" to "service_role";

grant select on table "public"."consent_compliance" to "service_role";

grant trigger on table "public"."consent_compliance" to "service_role";

grant truncate on table "public"."consent_compliance" to "service_role";

grant update on table "public"."consent_compliance" to "service_role";

grant delete on table "public"."consent_preferences" to "service_role";

grant insert on table "public"."consent_preferences" to "service_role";

grant references on table "public"."consent_preferences" to "service_role";

grant select on table "public"."consent_preferences" to "service_role";

grant trigger on table "public"."consent_preferences" to "service_role";

grant truncate on table "public"."consent_preferences" to "service_role";

grant update on table "public"."consent_preferences" to "service_role";

grant delete on table "public"."exercise_completions" to "service_role";

grant insert on table "public"."exercise_completions" to "service_role";

grant references on table "public"."exercise_completions" to "service_role";

grant select on table "public"."exercise_completions" to "service_role";

grant trigger on table "public"."exercise_completions" to "service_role";

grant truncate on table "public"."exercise_completions" to "service_role";

grant update on table "public"."exercise_completions" to "service_role";

grant delete on table "public"."exercise_programs" to "service_role";

grant insert on table "public"."exercise_programs" to "service_role";

grant references on table "public"."exercise_programs" to "service_role";

grant select on table "public"."exercise_programs" to "service_role";

grant trigger on table "public"."exercise_programs" to "service_role";

grant truncate on table "public"."exercise_programs" to "service_role";

grant update on table "public"."exercise_programs" to "service_role";

grant delete on table "public"."message_logs" to "service_role";

grant insert on table "public"."message_logs" to "service_role";

grant references on table "public"."message_logs" to "service_role";

grant select on table "public"."message_logs" to "service_role";

grant trigger on table "public"."message_logs" to "service_role";

grant truncate on table "public"."message_logs" to "service_role";

grant update on table "public"."message_logs" to "service_role";

grant delete on table "public"."message_templates" to "service_role";

grant insert on table "public"."message_templates" to "service_role";

grant references on table "public"."message_templates" to "service_role";

grant select on table "public"."message_templates" to "service_role";

grant trigger on table "public"."message_templates" to "service_role";

grant truncate on table "public"."message_templates" to "service_role";

grant update on table "public"."message_templates" to "service_role";

grant delete on table "public"."patient_compliance" to "service_role";

grant insert on table "public"."patient_compliance" to "service_role";

grant references on table "public"."patient_compliance" to "service_role";

grant select on table "public"."patient_compliance" to "service_role";

grant trigger on table "public"."patient_compliance" to "service_role";

grant truncate on table "public"."patient_compliance" to "service_role";

grant update on table "public"."patient_compliance" to "service_role";

grant delete on table "public"."patient_consents" to "service_role";

grant insert on table "public"."patient_consents" to "service_role";

grant references on table "public"."patient_consents" to "service_role";

grant select on table "public"."patient_consents" to "service_role";

grant trigger on table "public"."patient_consents" to "service_role";

grant truncate on table "public"."patient_consents" to "service_role";

grant update on table "public"."patient_consents" to "service_role";

grant delete on table "public"."patient_exercises" to "service_role";

grant insert on table "public"."patient_exercises" to "service_role";

grant references on table "public"."patient_exercises" to "service_role";

grant select on table "public"."patient_exercises" to "service_role";

grant trigger on table "public"."patient_exercises" to "service_role";

grant truncate on table "public"."patient_exercises" to "service_role";

grant update on table "public"."patient_exercises" to "service_role";

grant delete on table "public"."patient_progress" to "service_role";

grant insert on table "public"."patient_progress" to "service_role";

grant references on table "public"."patient_progress" to "service_role";

grant select on table "public"."patient_progress" to "service_role";

grant trigger on table "public"."patient_progress" to "service_role";

grant truncate on table "public"."patient_progress" to "service_role";

grant update on table "public"."patient_progress" to "service_role";

grant delete on table "public"."patients" to "service_role";

grant insert on table "public"."patients" to "service_role";

grant references on table "public"."patients" to "service_role";

grant select on table "public"."patients" to "service_role";

grant trigger on table "public"."patients" to "service_role";

grant truncate on table "public"."patients" to "service_role";

grant update on table "public"."patients" to "service_role";

grant delete on table "public"."subscription_plans" to "service_role";

grant insert on table "public"."subscription_plans" to "service_role";

grant references on table "public"."subscription_plans" to "service_role";

grant select on table "public"."subscription_plans" to "service_role";

grant trigger on table "public"."subscription_plans" to "service_role";

grant truncate on table "public"."subscription_plans" to "service_role";

grant update on table "public"."subscription_plans" to "service_role";

grant delete on table "public"."treatment_outcomes" to "service_role";

grant insert on table "public"."treatment_outcomes" to "service_role";

grant references on table "public"."treatment_outcomes" to "service_role";

grant select on table "public"."treatment_outcomes" to "service_role";

grant trigger on table "public"."treatment_outcomes" to "service_role";

grant truncate on table "public"."treatment_outcomes" to "service_role";

grant update on table "public"."treatment_outcomes" to "service_role";

grant delete on table "public"."treatment_plans" to "service_role";

grant insert on table "public"."treatment_plans" to "service_role";

grant references on table "public"."treatment_plans" to "service_role";

grant select on table "public"."treatment_plans" to "service_role";

grant trigger on table "public"."treatment_plans" to "service_role";

grant truncate on table "public"."treatment_plans" to "service_role";

grant update on table "public"."treatment_plans" to "service_role";

grant delete on table "public"."usage_logs" to "service_role";

grant insert on table "public"."usage_logs" to "service_role";

grant references on table "public"."usage_logs" to "service_role";

grant select on table "public"."usage_logs" to "service_role";

grant trigger on table "public"."usage_logs" to "service_role";

grant truncate on table "public"."usage_logs" to "service_role";

grant update on table "public"."usage_logs" to "service_role";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";


  create policy "service_role_analytics_daily_access"
  on "public"."analytics_daily"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_appointments_access"
  on "public"."appointments"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_campaign_enrollments_access"
  on "public"."campaign_enrollments"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_campaigns_access"
  on "public"."campaigns"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_clinics_access"
  on "public"."clinics"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_exercise_completions_access"
  on "public"."exercise_completions"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_exercise_programs_access"
  on "public"."exercise_programs"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_message_logs_access"
  on "public"."message_logs"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_message_templates_access"
  on "public"."message_templates"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_patient_compliance_access"
  on "public"."patient_compliance"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_patient_exercises_access"
  on "public"."patient_exercises"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_patient_progress_access"
  on "public"."patient_progress"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_patients_access"
  on "public"."patients"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_treatment_outcomes_access"
  on "public"."treatment_outcomes"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_treatment_plans_access"
  on "public"."treatment_plans"
  as permissive
  for all
  to public
using (is_service_role());



  create policy "service_role_usage_logs_access"
  on "public"."usage_logs"
  as permissive
  for all
  to public
using (is_service_role());



