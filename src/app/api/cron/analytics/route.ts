import { NextRequest, NextResponse } from "next/server";
import { withServiceRole } from "@/server/supabase-service";
import { env } from "@/env";
import type { SupabaseClient } from "@supabase/supabase-js";

// Type definitions for better type safety
interface AppointmentMetrics {
  total_appointments: number;
  completed_appointments: number;
  no_shows: number;
  cancellations: number;
}

interface SMSMetrics {
  sms_sent: number;
  sms_delivered: number;
  sms_responded: number;
}

interface ExerciseMetrics {
  exercise_completions: number;
  patient_check_ins: number;
}

interface ComplianceMetrics {
  avg_appointment_compliance: number;
  avg_exercise_compliance: number;
  avg_communication_response: number;
}

interface AnalyticsData {
  clinic_id: string;
  date: string;
  total_appointments: number;
  completed_appointments: number;
  no_shows: number;
  cancellations: number;
  sms_sent: number;
  sms_delivered: number;
  sms_responded: number;
  exercise_completions: number;
  patient_check_ins: number;
  avg_appointment_compliance: number;
  avg_exercise_compliance: number;
  avg_communication_response: number;
  created_at: string;
}

interface AppointmentRecord {
  status: string;
}

interface MessageLogRecord {
  status: string;
  message_type: string;
}

interface ComplianceRecord {
  appointment_compliance_rate: number | null;
  exercise_compliance_rate: number | null;
  communication_response_rate: number | null;
}

/**
 * Nightly Analytics Cron Job
 *
 * Runs daily at 2:00 AM to aggregate metrics from the previous day
 *
 * Setup for cron-job.org:
 * URL: https://your-app.vercel.app/api/cron/analytics?token=YOUR_CRON_SECRET
 * Schedule: 0 2 * * * (daily at 2:00 AM)
 *
 * This endpoint aggregates:
 * - Appointment metrics (total, completed, no-shows, cancellations)
 * - SMS metrics (sent, delivered, responded)
 * - Exercise compliance metrics
 * - Patient engagement metrics
 * - Treatment outcome metrics
 */

// Verify cron token for security
function verifyCronToken(token: string | null): boolean {
  if (!token || token !== env.CRON_SECRET) {
    return false;
  }
  return true;
}

// Aggregate appointment metrics for a specific date
async function aggregateAppointmentMetrics(
  supabase: SupabaseClient,
  clinicId: string,
  date: string
): Promise<AppointmentMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("appointments")
    .select("status")
    .eq("clinic_id", clinicId)
    .gte("scheduled_at", `${date}T00:00:00`)
    .lt("scheduled_at", `${date}T23:59:59`);

  if (error) {
    console.error("Error fetching appointments:", error);
    return {
      total_appointments: 0,
      completed_appointments: 0,
      no_shows: 0,
      cancellations: 0,
    };
  }

  const metrics: AppointmentMetrics = {
    total_appointments: (data as AppointmentRecord[]).length,
    completed_appointments: (data as AppointmentRecord[]).filter(
      (a: AppointmentRecord) => a.status === "completed"
    ).length,
    no_shows: (data as AppointmentRecord[]).filter(
      (a: AppointmentRecord) => a.status === "no_show"
    ).length,
    cancellations: (data as AppointmentRecord[]).filter(
      (a: AppointmentRecord) => a.status === "cancelled"
    ).length,
  };

  return metrics;
}

// Aggregate SMS metrics for a specific date
async function aggregateSMSMetrics(
  supabase: SupabaseClient,
  clinicId: string,
  date: string
): Promise<SMSMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("message_logs")
    .select("status, message_type")
    .eq("clinic_id", clinicId)
    .eq("message_type", "sms")
    .gte("sent_at", `${date}T00:00:00`)
    .lt("sent_at", `${date}T23:59:59`);

  if (error) {
    console.error("Error fetching SMS logs:", error);
    return {
      sms_sent: 0,
      sms_delivered: 0,
      sms_responded: 0,
    };
  }

  const metrics: SMSMetrics = {
    sms_sent: (data as MessageLogRecord[]).length,
    sms_delivered: (data as MessageLogRecord[]).filter(
      (m: MessageLogRecord) => m.status === "delivered"
    ).length,
    sms_responded: (data as MessageLogRecord[]).filter(
      (m: MessageLogRecord) => m.status === "responded"
    ).length,
  };

  return metrics;
}

// Aggregate exercise compliance metrics for a specific date
async function aggregateExerciseMetrics(
  supabase: SupabaseClient,
  clinicId: string,
  date: string
): Promise<ExerciseMetrics> {
  // Exercise completions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exerciseData, error: exerciseError } = await (supabase as any)
    .from("exercise_completions")
    .select("id")
    .eq("clinic_id", clinicId)
    .gte("completed_at", `${date}T00:00:00`)
    .lt("completed_at", `${date}T23:59:59`);

  // Patient check-ins (progress updates)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progressData, error: progressError } = await (supabase as any)
    .from("patient_progress")
    .select("id")
    .eq("clinic_id", clinicId)
    .gte("created_at", `${date}T00:00:00`)
    .lt("created_at", `${date}T23:59:59`);

  if (exerciseError || progressError) {
    console.error("Error fetching exercise metrics:", {
      exerciseError,
      progressError,
    });
    return {
      exercise_completions: 0,
      patient_check_ins: 0,
    };
  }

  return {
    exercise_completions: (exerciseData as Record<string, unknown>[]).length,
    patient_check_ins: (progressData as Record<string, unknown>[]).length,
  };
}

// Aggregate patient compliance metrics for a specific date
async function aggregateComplianceMetrics(
  supabase: SupabaseClient,
  clinicId: string,
  date: string
): Promise<ComplianceMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("patient_compliance")
    .select(
      "appointment_compliance_rate, exercise_compliance_rate, communication_response_rate"
    )
    .eq("clinic_id", clinicId)
    .gte("last_updated", `${date}T00:00:00`)
    .lt("last_updated", `${date}T23:59:59`);

  if (error || !data || (data as ComplianceRecord[]).length === 0) {
    console.error("Error fetching compliance data:", error);
    return {
      avg_appointment_compliance: 0,
      avg_exercise_compliance: 0,
      avg_communication_response: 0,
    };
  }

  const totals = (data as ComplianceRecord[]).reduce(
    (
      acc: { appointment: number; exercise: number; communication: number },
      record: ComplianceRecord
    ) => ({
      appointment: acc.appointment + (record.appointment_compliance_rate || 0),
      exercise: acc.exercise + (record.exercise_compliance_rate || 0),
      communication:
        acc.communication + (record.communication_response_rate || 0),
    }),
    { appointment: 0, exercise: 0, communication: 0 }
  );

  const count = (data as ComplianceRecord[]).length;
  return {
    avg_appointment_compliance:
      Math.round((totals.appointment / count) * 100) / 100,
    avg_exercise_compliance: Math.round((totals.exercise / count) * 100) / 100,
    avg_communication_response:
      Math.round((totals.communication / count) * 100) / 100,
  };
}

// Main analytics aggregation function
async function aggregateDailyAnalytics(
  supabase: SupabaseClient,
  clinicId: string,
  date: string
): Promise<AnalyticsData> {
  try {
    // Aggregate all metrics in parallel
    const [appointmentMetrics, smsMetrics, exerciseMetrics, complianceMetrics] =
      await Promise.all([
        aggregateAppointmentMetrics(supabase, clinicId, date),
        aggregateSMSMetrics(supabase, clinicId, date),
        aggregateExerciseMetrics(supabase, clinicId, date),
        aggregateComplianceMetrics(supabase, clinicId, date),
      ]);

    // Combine all metrics
    const analyticsData: AnalyticsData = {
      clinic_id: clinicId,
      date,
      ...appointmentMetrics,
      ...smsMetrics,
      ...exerciseMetrics,
      ...complianceMetrics,
      created_at: new Date().toISOString(),
    };

    // Upsert analytics data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase as any)
      .from("analytics_daily")
      .upsert(analyticsData, {
        onConflict: "clinic_id,date",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error("Error upserting analytics:", upsertError);
      throw new Error(`Failed to upsert analytics: ${upsertError.message}`);
    }

    return analyticsData;
  } catch (error) {
    console.error("Error in aggregateDailyAnalytics:", error);
    throw error;
  }
}

// GET endpoint for health check and manual testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const testDate = searchParams.get("date"); // Optional: test with specific date

  // Verify cron token
  if (!verifyCronToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use service role to access all clinics
    const result = await withServiceRole(async (supabase) => {
      // Get all active clinics
      const { data: clinics, error: clinicsError } = await supabase
        .from("clinics")
        .select("id")
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (clinicsError) {
        throw new Error(`Failed to fetch clinics: ${clinicsError.message}`);
      }

      if (!clinics || clinics.length === 0) {
        return {
          success: true,
          message: "No clinics found to process",
          results: [],
          timestamp: new Date().toISOString(),
        };
      }

      // Type assertion for clinics
      const typedClinics = clinics as Array<{ id: string }>;

      // Use test date or yesterday
      const targetDate =
        testDate ||
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Aggregate analytics for each clinic
      const results = [];
      for (const clinic of typedClinics) {
        try {
          const analytics = await aggregateDailyAnalytics(
            supabase,
            clinic.id,
            targetDate
          );
          results.push({
            clinic_id: clinic.id,
            date: targetDate,
            success: true,
            data: analytics,
          });
        } catch (error) {
          results.push({
            clinic_id: clinic.id,
            date: targetDate,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        success: true,
        message: `Analytics aggregated for ${targetDate}`,
        results,
        timestamp: new Date().toISOString(),
      };
    }, "analytics_cron_get");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST endpoint for cron job execution
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (process.env.TEST_MODE === '1') {
    return NextResponse.json({ ok: true, dryRun: true }, { status: 200 });
  }

  // Allow requests without token for testing
  if (!token && process.env.NODE_ENV === "development") {
    return NextResponse.json({
      success: true,
      message: "Analytics endpoint accessible (test mode)",
      testMode: true,
    });
  }

  // Verify cron token
  if (!verifyCronToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use service role to access all clinics
    const result = await withServiceRole(async (supabase) => {
      // Always aggregate for yesterday
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // Get all active clinics (excluding system clinic)
      const { data: clinics, error: clinicsError } = await supabase
        .from("clinics")
        .select("id")
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (clinicsError) {
        throw new Error(`Failed to fetch clinics: ${clinicsError.message}`);
      }

      if (!clinics || clinics.length === 0) {
        return {
          success: true,
          message: "No clinics found to process",
          results: [],
          timestamp: new Date().toISOString(),
        };
      }

      // Type assertion for clinics
      const typedClinics = clinics as Array<{ id: string }>;

      // Aggregate analytics for each clinic
      const results = [];
      for (const clinic of typedClinics) {
        try {
          const analytics = await aggregateDailyAnalytics(
            supabase,
            clinic.id,
            yesterday
          );
          results.push({
            clinic_id: clinic.id,
            date: yesterday,
            success: true,
            data: analytics,
          });
        } catch (error) {
          results.push({
            clinic_id: clinic.id,
            date: yesterday,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        success: true,
        message: `Nightly analytics completed for ${yesterday}`,
        results,
        timestamp: new Date().toISOString(),
      };
    }, "analytics_cron_post");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Nightly analytics cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// HEAD endpoint for health check (no token required)
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
