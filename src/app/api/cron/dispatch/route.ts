import { NextRequest, NextResponse } from "next/server";
import {
  processDueReminders,
  getMessageEngineStatus,
  detectAndMarkNoShows,
} from "@/server/message-engine";
import { env } from "@/env";

/**
 * Cron Dispatch Endpoint for External Cron Services
 *
 * SETUP INSTRUCTIONS FOR CRON-JOB.ORG:
 *
 * 1. Go to https://cron-job.org and create an account
 * 2. Create a new cron job with these settings:
 *    - Title: "RehabFlow Message Dispatch"
 *    - URL: https://YOUR-APP.vercel.app/api/cron/dispatch?token=YOUR_CRON_SECRET
 *    - Schedule: Every 5 minutes
 *    - Cron expression: 0,5,10,15,20,25,30,35,40,45,50,55 * * * *
 *    - Timezone: Your clinic's timezone
 *    - HTTP Method: GET
 *    - Retry on failure: Yes (3 retries)
 *
 * 3. Replace YOUR-APP with your actual Vercel app name
 * 4. Replace YOUR_CRON_SECRET with the value from your .env.local CRON_SECRET
 *
 * EXAMPLE URL:
 * https://rehabflow-abc123.vercel.app/api/cron/dispatch?token=your-secret-here
 *
 * SECURITY NOTES:
 * - Keep your CRON_SECRET secure and unique
 * - This endpoint is idempotent - safe to run multiple times per minute
 * - All operations check message_logs to prevent duplicate sends
 * - Rate limiting is built into the message engine
 */

// Verify cron token from query parameter for external cron services
function verifyCronToken(request: NextRequest): boolean {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    console.warn(
      "CRON_SECRET not configured - allowing request in development only"
    );
    return process.env.NODE_ENV === "development";
  }

  if (!token) {
    console.error("No token provided in query parameters");
    return false;
  }

  // Simple token comparison (HMAC could be added for production)
  const isValid = token === cronSecret;

  if (!isValid) {
    console.error("Invalid cron token provided");
  }

  return isValid;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization via token query parameter
    if (!verifyCronToken(request)) {
      console.error("Unauthorized cron request - invalid or missing token");
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing token parameter",
          hint: "Use ?token=YOUR_CRON_SECRET in the URL",
        },
        { status: 401 }
      );
    }

    console.log("🕐 External cron job triggered:", new Date().toISOString());

    // Get current engine status
    const engineStatus = await getMessageEngineStatus();

    if (engineStatus.status === "error") {
      console.error(
        "❌ Message engine health check failed:",
        engineStatus.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Message engine health check failed",
          details: engineStatus,
          execution_time_ms: Date.now() - startTime,
        },
        { status: 500 }
      );
    }

    // At this point, we know status is 'healthy' and total_pending is defined
    const totalPending = engineStatus.total_pending;
    console.log(`📊 Engine status: ${totalPending} pending messages`);

    // Step 1: Detect and mark no-shows
    console.log("🔍 Detecting no-shows...");
    const noShowResult = await detectAndMarkNoShows();

    if (noShowResult.marked > 0) {
      console.log(`✅ Marked ${noShowResult.marked} appointments as no-shows`);
      if (noShowResult.errors.length > 0) {
        console.error(
          `❌ ${noShowResult.errors.length} errors during no-show detection`
        );
      }
    } else {
      console.log("✨ No new no-shows detected");
    }

    // Step 2: Process due reminders (including no-show recovery messages)
    // Note: This is idempotent - message_logs unique constraints prevent duplicate sends
    let dispatchResult = null;
    if (totalPending > 0) {
      console.log(`🚀 Processing ${totalPending} due reminders...`);
      dispatchResult = await processDueReminders();

      if (dispatchResult.success) {
        console.log(
          `✅ Successfully processed ${dispatchResult.processed} messages`
        );
      } else {
        console.error(
          `❌ Processed ${dispatchResult.processed} messages with ${dispatchResult.errors.length} errors`
        );
      }
    } else {
      console.log("✨ No messages due for processing");
    }

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      execution_time_ms: executionTime,
      engine_status: engineStatus,
      no_show_result: noShowResult,
      dispatch_result: dispatchResult,
      message: `No-shows: ${noShowResult.marked} marked${noShowResult.errors.length > 0 ? ` (${noShowResult.errors.length} errors)` : ""}. Messages: ${dispatchResult ? `${dispatchResult.processed} processed${dispatchResult.errors.length > 0 ? ` (${dispatchResult.errors.length} errors)` : ""}` : "0 processed"}`,
      idempotency_note:
        "This endpoint is safe to call multiple times per minute - duplicate sends are prevented by message_logs unique constraints",
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error("💥 External cron job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Optional: Allow POST for manual testing (still requires token)
export async function POST(request: NextRequest) {
  // Verify token for POST requests too
  if (!verifyCronToken(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid or missing token parameter",
        hint: "Use ?token=YOUR_CRON_SECRET in the URL",
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const dryRun = body.dry_run === true;

  console.log(`🧪 Manual dispatch triggered (dry_run: ${dryRun})`);

  try {
    const engineStatus = await getMessageEngineStatus();

    let dispatchResult = null;
    if (
      !dryRun &&
      engineStatus.status === "healthy" &&
      engineStatus.total_pending > 0
    ) {
      dispatchResult = await processDueReminders();
    }

    return NextResponse.json({
      success: true,
      dry_run: dryRun,
      timestamp: new Date().toISOString(),
      engine_status: engineStatus,
      dispatch_result: dispatchResult,
      message: dryRun
        ? `Dry run: Would process ${engineStatus.status === "healthy" ? engineStatus.total_pending : 0} messages`
        : dispatchResult
          ? `Processed ${dispatchResult.processed} messages`
          : "No messages were due for processing",
    });
  } catch (error) {
    console.error("💥 Manual dispatch failed:", error);

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

// Health check endpoint (no token required for monitoring)
export async function HEAD() {
  try {
    const status = await getMessageEngineStatus();
    return new NextResponse(null, {
      status: status.status === "healthy" ? 200 : 503,
      headers: {
        "X-Engine-Status": status.status,
        "X-Pending-Messages": status.status === "healthy" ? status.total_pending.toString() : "0",
        "X-Last-Check": status.last_check,
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
