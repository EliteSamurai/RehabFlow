import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sendSMS, sendBulkSMS } from "@/server/sms";
import { z } from "zod";

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
  messages: z.array(
    z.object({
      to: z
        .string()
        .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format (E.164)"),
      message: z.string().min(1).max(1600),
      patientId: z.string().uuid().optional(),
      appointmentId: z.string().uuid().optional(),
    })
  ),
});

// Test message schema
const sendTestSMSSchema = z.object({
  to: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format (E.164)"),
  testType: z.enum(["welcome", "reminder", "exercise"]).default("welcome"),
});

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

    const body = await request.json();
    const { isTest, isBulk, ...rest } = body;

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
        clinicId,
        messageType: "reminder",
      });

      return NextResponse.json(result);
    }

    if (isBulk) {
      const { messages } = sendBulkSMSSchema.parse(body);

      const results = await sendBulkSMS(messages, clinicId);

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
      clinicId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("SMS Send Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}

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
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireUser();

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
      { status: 401 }
    );
  }
}
