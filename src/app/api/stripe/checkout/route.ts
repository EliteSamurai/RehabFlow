import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/billing/actions";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    
    // Get clinic_id from user metadata
    const clinicId = user.user_metadata?.clinic_id;
    if (!clinicId) {
      return NextResponse.json(
        { error: "User not associated with a clinic" },
        { status: 400 }
      );
    }

    const { planId, trialDays } = await request.json();
    const result = await createCheckoutSession(planId, clinicId, trialDays);

    if (result.sessionId) {
      return NextResponse.json({ sessionId: result.sessionId, url: result.url });
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
