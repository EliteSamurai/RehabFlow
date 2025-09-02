import { NextResponse } from "next/server";
import { withServiceRole } from "@/server/supabase-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const startTime = Date.now();

    // Test database connectivity
    const { data: clinics, error: clinicsError } = await withServiceRole(
      async (supabase) => {
        return await supabase.from("clinics").select("id").limit(1);
      },
      "debug-clinics-test"
    );

    const { data: patients, error: patientsError } = await withServiceRole(
      async (supabase) => {
        return await supabase.from("patients").select("id").limit(1);
      },
      "debug-patients-test"
    );

    const { data: appointments, error: appointmentsError } =
      await withServiceRole(async (supabase) => {
        return await supabase.from("appointments").select("id").limit(1);
      }, "debug-appointments-test");

    const { data: message_logs, error: messageLogsError } =
      await withServiceRole(async (supabase) => {
        return await supabase.from("message_logs").select("id").limit(1);
      }, "debug-message-logs-test");

    const { data: message_templates, error: messageTemplatesError } =
      await withServiceRole(async (supabase) => {
        return await supabase.from("message_templates").select("id").limit(1);
      }, "debug-message-templates-test");

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      execution_time_ms: executionTime,
      table_test: {
        clinics: {
          accessible: !clinicsError,
          error: clinicsError?.message || null,
          count: clinics?.length || 0,
        },
        patients: {
          accessible: !patientsError,
          error: patientsError?.message || null,
          count: patients?.length || 0,
        },
        appointments: {
          accessible: !appointmentsError,
          error: appointmentsError?.message || null,
          count: appointments?.length || 0,
        },
        message_logs: {
          accessible: !messageLogsError,
          error: messageLogsError?.message || null,
          count: message_logs?.length || 0,
        },
        message_templates: {
          accessible: !messageTemplatesError,
          error: messageTemplatesError?.message || null,
          count: message_templates?.length || 0,
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
