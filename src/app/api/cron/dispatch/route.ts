import { NextRequest, NextResponse } from "next/server";
import { 
  processDueReminders, 
  getMessageEngineStatus,
  detectAndMarkNoShows 
} from "@/server/message-engine";
import { env } from "@/env";

// Verify cron secret to ensure only Vercel cron can trigger this
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn("CRON_SECRET not configured - allowing request in development");
    return process.env.NODE_ENV === "development";
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authorization
    if (!verifyCronSecret(request)) {
      console.error("Unauthorized cron request");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🕐 Cron job triggered:", new Date().toISOString());

    // Get current engine status
    const engineStatus = await getMessageEngineStatus();
    
    if (engineStatus.status === 'error') {
      console.error("❌ Message engine health check failed:", engineStatus.error);
      return NextResponse.json({
        success: false,
        error: "Message engine health check failed",
        details: engineStatus,
        execution_time_ms: Date.now() - startTime
      }, { status: 500 });
    }

    console.log(`📊 Engine status: ${engineStatus.total_pending} pending messages`);

    // Step 1: Detect and mark no-shows
    console.log("🔍 Detecting no-shows...");
    const noShowResult = await detectAndMarkNoShows();
    
    if (noShowResult.marked > 0) {
      console.log(`✅ Marked ${noShowResult.marked} appointments as no-shows`);
      if (noShowResult.errors.length > 0) {
        console.error(`❌ ${noShowResult.errors.length} errors during no-show detection`);
      }
    } else {
      console.log("✨ No new no-shows detected");
    }

    // Step 2: Process due reminders (including no-show recovery messages)
    let dispatchResult = null;
    if (engineStatus.total_pending > 0) {
      console.log(`🚀 Processing ${engineStatus.total_pending} due reminders...`);
      dispatchResult = await processDueReminders();
      
      if (dispatchResult.success) {
        console.log(`✅ Successfully processed ${dispatchResult.processed} messages`);
      } else {
        console.error(`❌ Processed ${dispatchResult.processed} messages with ${dispatchResult.errors.length} errors`);
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
      message: `No-shows: ${noShowResult.marked} marked${noShowResult.errors.length > 0 ? ` (${noShowResult.errors.length} errors)` : ''}. Messages: ${dispatchResult ? `${dispatchResult.processed} processed${dispatchResult.errors.length > 0 ? ` (${noShowResult.errors.length} errors)` : ''}` : '0 processed'}`
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error("💥 Cron job failed:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Optional: Allow POST for manual testing
export async function POST(request: NextRequest) {
  // Only allow in development or with proper auth
  if (process.env.NODE_ENV === "production" && !verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const dryRun = body.dry_run === true;

  console.log(`🧪 Manual dispatch triggered (dry_run: ${dryRun})`);

  try {
    const engineStatus = await getMessageEngineStatus();
    
    let dispatchResult = null;
    if (!dryRun && engineStatus.total_pending > 0) {
      dispatchResult = await processDueReminders();
    }

    return NextResponse.json({
      success: true,
      dry_run: dryRun,
      timestamp: new Date().toISOString(),
      engine_status: engineStatus,
      dispatch_result: dispatchResult,
      message: dryRun 
        ? `Dry run: Would process ${engineStatus.total_pending} messages`
        : dispatchResult
          ? `Processed ${dispatchResult.processed} messages`
          : "No messages were due for processing"
    });

  } catch (error) {
    console.error("💥 Manual dispatch failed:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Health check endpoint
export async function HEAD() {
  try {
    const status = await getMessageEngineStatus();
    return new NextResponse(null, {
      status: status.status === 'healthy' ? 200 : 503,
      headers: {
        'X-Engine-Status': status.status,
        'X-Pending-Messages': status.total_pending.toString(),
        'X-Last-Check': status.last_check
      }
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}