import { Twilio } from "twilio";
import { env } from "@/env";
import { supabaseServer } from "./supabase";

// Initialize Twilio client
const twilioClient = new Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export interface SendSMSOptions {
  to: string;
  message: string;
  clinicId: string;
  patientId?: string;
  appointmentId?: string;
  campaignId?: string;
  templateId?: string;
  messageType?:
    | "reminder"
    | "exercise"
    | "progress"
    | "compliance"
    | "marketing";
  metadata?: Record<string, unknown>; // For campaign step tracking and idempotency
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveryStatus?: string;
}

/**
 * Send SMS message via Twilio
 */
export async function sendSMS(options: SendSMSOptions): Promise<SMSResponse> {
  try {
    // Check if real SMS is enabled
    if (env.ENABLE_REAL_SMS !== "true") {
      console.log("📱 Mock SMS:", {
        to: options.to,
        message: options.message,
        type: options.messageType || "general",
      });

      // Log to database for testing
      await logMessage({
        ...options,
        messageId: `mock_${Date.now()}`,
        status: "sent",
        deliveryStatus: "delivered",
        metadata: options.metadata,
      });

      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        deliveryStatus: "delivered",
      };
    }

    // Check patient opt-in status
    const isOptedIn = await checkPatientOptInStatus(
      options.to,
      options.clinicId
    );
    if (!isOptedIn) {
      throw new Error("Patient has opted out of SMS communications");
    }

    // Send SMS via Twilio
    const message = await twilioClient.messages.create({
      body: options.message,
      to: options.to,
      messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
    });

    // Log message to database
    await logMessage({
      ...options,
      messageId: message.sid,
      status: "sent",
      deliveryStatus: message.status,
      metadata: options.metadata,
    });

    return {
      success: true,
      messageId: message.sid,
      deliveryStatus: message.status,
    };
  } catch (error) {
    console.error("SMS Error:", error);

    // Log failed message
    await logMessage({
      ...options,
      messageId: null,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      metadata: options.metadata,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSMS(
  messages: Omit<SendSMSOptions, "clinicId">[],
  clinicId: string
): Promise<SMSResponse[]> {
  const results: SMSResponse[] = [];

  for (const message of messages) {
    const result = await sendSMS({ ...message, clinicId });
    results.push(result);

    // Add delay between messages to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Check if patient has opted in to SMS communications
 */
async function checkPatientOptInStatus(
  phoneNumber: string,
  clinicId: string
): Promise<boolean> {
  try {
    const supabase = await supabaseServer();

    const { data: patient } = await supabase
      .from("patients")
      .select("opt_in_sms")
      .eq("phone", phoneNumber)
      .eq("clinic_id", clinicId)
      .single();

    return patient?.opt_in_sms ?? false;
  } catch (error) {
    console.error("Error checking opt-in status:", error);
    return false;
  }
}

/**
 * Update patient opt-in status
 */
export async function updatePatientOptInStatus(
  phoneNumber: string,
  clinicId: string,
  optedIn: boolean
): Promise<boolean> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("patients")
      .update({ opt_in_sms: optedIn })
      .eq("phone", phoneNumber)
      .eq("clinic_id", clinicId);

    if (error) {
      console.error("Error updating opt-in status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating opt-in status:", error);
    return false;
  }
}

/**
 * Log message to database
 */
async function logMessage(options: {
  to: string;
  message: string;
  clinicId: string;
  patientId?: string;
  appointmentId?: string;
  campaignId?: string;
  templateId?: string;
  messageType?: string;
  messageId: string | null;
  status: string;
  deliveryStatus?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await supabaseServer();

    await supabase.from("message_logs").insert({
      clinic_id: options.clinicId,
      patient_id: options.patientId,
      appointment_id: options.appointmentId,
      campaign_id: options.campaignId,
      template_id: options.templateId,
      message_type: "sms",
      content: options.message,
      recipient: options.to,
      status: options.status,
      twilio_sid: options.messageId,
      sent_at: new Date().toISOString(),
      delivered_at:
        options.deliveryStatus === "delivered"
          ? new Date().toISOString()
          : null,
      error_message: options.errorMessage,
      metadata: options.metadata || {},
    });
  } catch (error) {
    console.error("Error logging message:", error);
  }
}

/**
 * Handle Twilio delivery webhook
 */
export async function handleDeliveryWebhook(
  messageSid: string,
  deliveryStatus: string,
  errorCode?: string
): Promise<void> {
  try {
    const supabase = await supabaseServer();

    // Update message log with delivery status
    const { error } = await supabase
      .from("message_logs")
      .update({
        status: deliveryStatus,
        delivered_at:
          deliveryStatus === "delivered" ? new Date().toISOString() : null,
        error_message: errorCode || null,
      })
      .eq("twilio_sid", messageSid);

    if (error) {
      console.error("Error updating delivery status:", error);
    } else {
      console.log(
        `Updated delivery status for ${messageSid}: ${deliveryStatus}`
      );
    }
  } catch (error) {
    console.error("Error handling delivery webhook:", error);
  }
}

/**
 * Get message delivery statistics
 */
export async function getMessageStats(
  clinicId: string,
  days: number = 30
): Promise<{
  total: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
}> {
  try {
    const supabase = await supabaseServer();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: messages, error } = await supabase
      .from("message_logs")
      .select("status")
      .eq("clinic_id", clinicId)
      .gte("sent_at", startDate.toISOString());

    if (error) {
      console.error("Error fetching message stats:", error);
      return { total: 0, delivered: 0, failed: 0, pending: 0, deliveryRate: 0 };
    }

    const total = messages?.length || 0;
    const delivered =
      messages?.filter((m) => m.status === "delivered").length || 0;
    const failed = messages?.filter((m) => m.status === "failed").length || 0;
    const pending = messages?.filter((m) => m.status === "sent").length || 0;
    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

    return {
      total,
      delivered,
      failed,
      pending,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
    };
  } catch (error) {
    console.error("Error getting message stats:", error);
    return { total: 0, delivered: 0, failed: 0, pending: 0, deliveryRate: 0 };
  }
}

/**
 * Parse inbound message for opt-out/opt-in keywords
 */
export function parseOptMessage(message: string): "opt_out" | "opt_in" | null {
  const normalized = message.toLowerCase().trim();

  // Opt-out keywords
  const optOutKeywords = [
    "stop",
    "unsubscribe",
    "cancel",
    "end",
    "quit",
    "opt out",
    "optout",
  ];
  if (optOutKeywords.some((keyword) => normalized.includes(keyword))) {
    return "opt_out";
  }

  // Opt-in keywords
  const optInKeywords = [
    "start",
    "subscribe",
    "yes",
    "opt in",
    "optin",
    "join",
  ];
  if (optInKeywords.some((keyword) => normalized.includes(keyword))) {
    return "opt_in";
  }

  return null;
}

/**
 * Get clinic ID from phone number (sender ID)
 */
export async function getClinicFromPhone(
  phoneNumber: string
): Promise<string | null> {
  try {
    const supabase = await supabaseServer();

    const { data: clinic } = await supabase
      .from("clinics")
      .select("id")
      .eq("phone", phoneNumber)
      .single();

    return clinic?.id || null;
  } catch (error) {
    console.error("Error finding clinic by phone:", error);
    return null;
  }
}

/**
 * Send automated opt-out confirmation
 */
export async function sendOptOutConfirmation(
  to: string,
  clinicId: string
): Promise<void> {
  await sendSMS({
    to,
    message:
      "You have been unsubscribed from SMS messages. Reply START to opt back in.",
    clinicId,
    messageType: "compliance",
  });
}

/**
 * Send automated opt-in confirmation
 */
export async function sendOptInConfirmation(
  to: string,
  clinicId: string
): Promise<void> {
  await sendSMS({
    to,
    message:
      "You have been subscribed to SMS messages. Reply STOP to opt out at any time.",
    clinicId,
    messageType: "compliance",
  });
}

// Add this function to track SMS usage for billing
// TODO: Implement SMS usage tracking for billing
// async function trackSMSUsage(
//   clinicId: string,
//   messageId: string,
//   success: boolean
// ) {
//   try {
//     const supabase = supabaseService();
//
//     // Record usage for billing purposes
//     const { error } = await (supabase as any).from("usage_logs").upsert(
//       {
//         clinic_id: clinicId,
//         date: new Date().toISOString().split("T")[0], // Current date
//         sms_sent: success ? 1 : 0,
//         message_id: messageId,
//         created_at: new Date(),
//       },
//       {
//         onConflict: "clinic_id,date",
//       }
//     );
//
//     if (error) {
//       console.error("Error tracking SMS usage:", error);
//     } else {
//       console.log(
//         `SMS usage tracked for message ${messageId} in clinic ${clinicId}`
//       );
//     }
//   } catch (error) {
//     console.error("Error tracking SMS usage:", error);
//   }
// }
