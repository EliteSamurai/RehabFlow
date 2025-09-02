export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withServiceRole } from "@/server/supabase-service";

export async function GET() {
  try {
    const result = await withServiceRole(async (supabase) => {
      console.log("🔍 Testing service role access to clinics table...");

      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from("clinics")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("❌ Service role test failed:", testError);
        throw testError;
      }

      console.log("✅ Service role test passed:", testData);

      return {
        success: true,
        message: "Service role can access clinics table",
        data: testData,
        timestamp: new Date().toISOString(),
      };
    }, "debug_service_role");

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Debug endpoint error:", error);
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
