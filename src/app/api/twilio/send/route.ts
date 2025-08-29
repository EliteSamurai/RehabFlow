import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendSMS, sendBulkSMS } from "@/server/sms";
import { requireUser } from "@/lib/auth";

// Validation schema for single SMS
const sendSMSSchema = z.object({
  to: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format (E.164)"),
  message: z.string().min(1).max(1600), // SMS character limit
  patientId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  messageType: z
    .enum(["reminder", "exercise", "progress", "compliance", "marketing"])
    .optional(),
});

// Validation schema for bulk SMS
const sendBulkSMSSchema = z.object({
  messages: z.array(sendSMSSchema).min(1).max(100), // Limit bulk sends
});

// Test message schema
const sendTestSMSSchema = z.object({
  to: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format (E.164)"),
  testType: z.enum(["welcome", "reminder", "exercise"]).default("welcome"),
});

/**
 * POST /api/twilio/send
 * Send SMS message(s) via Twilio
 */
export async function POST() {
  try {
    // Authenticate user and get clinic
    const user = await requireUser();
    if (!user.clinic_id) {
      return NextResponse.json(
        { error: "User not associated with a clinic" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const url = new URL(request.url);
    const isBulk = url.searchParams.get("bulk") === "true";
    const isTest = url.searchParams.get("test") === "true";

    // Handle test SMS
    if (isTest) {
      const { to, testType } = sendTestSMSSchema.parse(body);

      const testMessages = {
        welcome: "Welcome to RehabFlow! You're all set to reduce no-shows 🚀",
        reminder:
          "Reminder: You have an appointment tomorrow at 2:00 PM. Reply CONFIRM to confirm.",
        exercise:
          "Time for your daily exercises! Complete your routine and reply DONE when finished.",
      };

      const result = await sendSMS({
        to,
        message: testMessages[testType],
        clinicId: user.clinic_id,
        messageType: "compliance",
      });

      return NextResponse.json(result);
    }

    // Handle bulk SMS
    if (isBulk) {
      const { messages } = sendBulkSMSSchema.parse(body);

      const results = await sendBulkSMS(messages, user.clinic_id);

      const summary = {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };

      return NextResponse.json(summary);
    }

    // Handle single SMS
    const smsData = sendSMSSchema.parse(body);

    const result = await sendSMS({
      ...smsData,
      clinicId: user.clinic_id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("SMS Send Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}

/**
 * GET /api/twilio/send
 * Get SMS sending capabilities and limits
 */
export async function GET() {
  try {
    await requireUser();

    // TODO: Get clinic subscription and SMS limits from database
    const capabilities = {
      canSendSMS: true,
      monthlyLimit: 5000, // Based on subscription plan
      monthlyUsed: 150, // From usage_logs table
      remainingThisMonth: 4850,
      rateLimitPerHour: 200,
      supportedMessageTypes: [
        "reminder",
        "exercise",
        "progress",
        "compliance",
        "marketing",
      ],
      maxMessageLength: 1600,
      maxBulkSize: 100,
    };

    return NextResponse.json(capabilities);
  } catch (error) {
    console.error("SMS Capabilities Error:", error);

    return NextResponse.json(
      { error: "Failed to get SMS capabilities" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/twilio/send
 * Cancel pending SMS messages (if supported)
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const messageId = url.searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID required" },
        { status: 400 }
      );
    }

    // TODO: Implement message cancellation via Twilio API
    // This would require the message to be in "queued" or "scheduled" status

    return NextResponse.json({
      success: false,
      error: "Message cancellation not yet implemented",
    });
  } catch (error) {
    console.error("SMS Cancel Error:", error);

    return NextResponse.json(
      { error: "Failed to cancel SMS" },
      { status: 500 }
    );
  }
}
