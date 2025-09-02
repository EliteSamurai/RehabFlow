import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/billing/actions";

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE === "1") {
    return NextResponse.json(
      { url: "http://localhost:3000/billing?mock=1" },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const { testMode, planId, trialDays } = body;

    // Handle test mode without authentication
    if (testMode) {
      return NextResponse.json({
        sessionId: "test_session_id",
        url: "https://checkout.stripe.com/test",
        testMode: true,
      });
    }

    const user = await requireUser();

    // Get clinic_id from user metadata
    const clinicId = user.user_metadata?.clinic_id;
    if (!clinicId) {
      return NextResponse.json(
        { error: "User not associated with a clinic" },
        { status: 400 }
      );
    }

    const result = await createCheckoutSession(planId, clinicId, trialDays);

    if (result.sessionId) {
      return NextResponse.json({
        sessionId: result.sessionId,
        url: result.url,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
