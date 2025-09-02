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
  -- Check multiple ways the service role might be identified
  RETURN (
    auth.role() = 'service_role'
    OR
    (auth.jwt() IS NOT NULL AND auth.jwt() ->> 'role' = 'service_role')
    OR
    (current_setting('request.jwt.claims', true) IS NOT NULL 
     AND current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
  );
END;
$function$
;


