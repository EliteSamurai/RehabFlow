import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  parseOptMessage,
  // updatePatientOptInStatus,
  sendOptOutConfirmation,
  sendOptInConfirmation,
  getClinicFromPhone,
} from "@/server/sms";
import { supabaseServer } from "@/server/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

// Twilio webhook payload schema
const twilioInboundSchema = z.object({
  MessageSid: z.string(),
  AccountSid: z.string(),
  MessagingServiceSid: z.string().optional(),
  From: z.string(), // Patient's phone number
  To: z.string(), // Clinic's phone number
  Body: z.string(), // Message content
  NumMedia: z.string().optional(),
  MediaUrl0: z.string().optional(),
  FromCountry: z.string().optional(),
  FromState: z.string().optional(),
  FromCity: z.string().optional(),
  FromZip: z.string().optional(),
});

/**
 * POST /api/twilio/inbound
 * Handle inbound SMS messages from Twilio webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data (Twilio sends form-encoded data)
    const formData = await request.formData();
    const data: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value.toString();
    }

    // Validate Twilio webhook data
    const webhookData = twilioInboundSchema.parse(data);

    console.log("📱 Inbound SMS:", {
      from: webhookData.From,
      to: webhookData.To,
      body: webhookData.Body,
      messageSid: webhookData.MessageSid,
    });

    // Find the clinic associated with the receiving phone number
    const clinicId = await getClinicFromPhone(webhookData.To);
    if (!clinicId) {
      console.error("No clinic found for phone number:", webhookData.To);
      return new NextResponse("OK", { status: 200 }); // Still return 200 to Twilio
    }

    // Parse message for opt-out/opt-in commands
    const optAction = parseOptMessage(webhookData.Body);

    // Handle opt-in/opt-out
    if (optAction) {
      await handleOptAction(
        webhookData.From,
        optAction === "opt_in" ? "START" : "STOP",
        clinicId,
        await supabaseServer()
      );
    } else {
      // Handle other types of inbound messages
      await handleGeneralInbound(
        webhookData.From,
        webhookData.Body,
        clinicId,
        await supabaseServer()
      );
    }

    // Log the inbound message
    await logInboundMessage(webhookData, clinicId, optAction);

    // Always return 200 to Twilio to acknowledge receipt
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Inbound SMS Error:", error);

    // Still return 200 to avoid Twilio retries for parsing errors
    return new NextResponse("OK", { status: 200 });
  }
}

/**
 * Handle opt-out/opt-in actions
 */
async function handleOptAction(
  phone: string,
  action: "START" | "STOP",
  clinicId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Update patient opt-in status
    const { error } = await supabase
      .from("patients")
      .update({ opt_in_sms: action === "START" })
      .eq("phone", phone)
      .eq("clinic_id", clinicId);

    if (error) {
      console.error("Error updating opt-in status:", error);
      return;
    }

    console.log(`Updated opt-in status for ${phone}: ${action}`);

    // Send confirmation message
    if (action === "STOP") {
      await sendOptOutConfirmation(phone, clinicId);
    } else {
      await sendOptInConfirmation(phone, clinicId);
    }

    console.log(`📱 Patient ${phone} ${action} processed successfully`);
  } catch (error) {
    console.error(`Error handling ${action}:`, error);
  }
}

/**
 * Handle general inbound messages (responses, questions, etc.)
 */
async function handleGeneralInbound(
  phone: string,
  message: string,
  clinicId: string,
  supabase: SupabaseClient
): Promise<string> {
  try {
    // Log the inbound message
    const { error } = await supabase.from("message_logs").insert({
      clinic_id: clinicId,
      patient_id: null, // No patient ID for general inbound messages
      message_type: "sms_inbound",
      content: message,
      recipient: phone,
      status: "received",
      twilio_sid: null, // No specific SID for general inbound
      sent_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
      notes: "Inbound message",
    });

    if (error) {
      console.error("Error logging inbound message:", error);
    }

    // For now, just acknowledge receipt
    return "Thank you for your message. A team member will respond shortly.";
  } catch (error) {
    console.error("Error handling general inbound:", error);
    return "Thank you for your message.";
  }
}

/**
 * Handle appointment confirmation responses
 */
// async function handleAppointmentConfirmation(
//   phone: string,
//   message: string,
//   clinicId: string,
//   supabase: SupabaseClient
// ): Promise<string> {
//   try {
//     // Find upcoming appointment for this phone number
//     const { data: appointments, error } = await supabase
//       .from("appointments")
//       .select(
//         `
//         id,
//         scheduled_at,
//         patients!inner (
//           id,
//           first_name,
//           last_name,
//           phone
//         )
//       `
//       )
//       .eq("patients.phone", phone)
//       .eq("clinic_id", clinicId)
//       .eq("status", "scheduled")
//       .gte("scheduled_at", new Date().toISOString())
//       .order("scheduled_at", { ascending: true })
//       .limit(1);

//     if (error || !appointments || appointments.length === 0) {
//       return "No upcoming appointments found. Please contact us to schedule.";
//     }

//     const appointment = appointments[0];
//     const appointmentDate = new Date(
//       appointment.scheduled_at
//     ).toLocaleDateString();
//     const appointmentTime = new Date(
//       appointment.scheduled_at
//     ).toLocaleTimeString();

//     // Update appointment status to confirmed
//     const { error: updateError } = await supabase
//       .from("appointments")
//       .update({ status: "confirmed" })
//       .eq("id", appointment.id);

//     if (updateError) {
//       console.error("Error confirming appointment:", updateError);
//       return "Unable to confirm appointment. Please call us.";
//     }

//     return `Appointment confirmed for ${appointmentDate} at ${appointmentTime}. See you soon!`;
//   } catch (error) {
//     console.error("Error handling appointment confirmation:", error);
//     return "Unable to confirm appointment. Please call us.";
//   }
// }

// /**
//  * Handle exercise completion responses
//  */
// async function handleExerciseCompletion(
//   phone: string,
//   message: string,
//   clinicId: string,
//   supabase: SupabaseClient
// ): Promise<string> {
//   try {
//     // Find patient by phone
//     const { data: patients, error } = await supabase
//       .from("patients")
//       .select("id, first_name, last_name")
//       .eq("phone", phone)
//       .eq("clinic_id", clinicId)
//       .single();

//     if (error || !patients) {
//       return "Patient not found. Please contact us.";
//     }

//     // Log exercise completion
//     const { error: logError } = await supabase
//       .from("exercise_completions")
//       .insert({
//         clinic_id: clinicId,
//         patient_id: patients.id,
//         completed_at: new Date().toISOString(),
//         compliance_score: 1.0, // Full compliance for SMS response
//         notes: "Completed via SMS response",
//       });

//     if (logError) {
//       console.error("Error logging exercise completion:", logError);
//     }

//     return `Great job, ${patients.first_name}! Exercise session logged. Keep up the good work!`;
//   } catch (error) {
//     console.error("Error handling exercise completion:", error);
//     return "Unable to log exercise completion. Please contact us.";
//   }
// }

// /**
//  * Handle pain level responses
//  */
// async function handlePainLevelResponse(
//   phone: string,
//   message: string,
//   clinicId: string,
//   supabase: SupabaseClient
// ): Promise<string> {
//   try {
//     // Extract pain level (assuming format like "Pain: 3" or just "3")
//     const painLevel = parseInt(message.replace(/\D/g, ""));

//     if (isNaN(painLevel) || painLevel < 0 || painLevel > 10) {
//       return "Please respond with a pain level from 0-10 (0 = no pain, 10 = worst pain).";
//     }

//     // Find patient by phone
//     const { data: patients, error } = await supabase
//       .from("patients")
//       .select("id, first_name, last_name")
//       .eq("phone", phone)
//       .eq("clinic_id", clinicId)
//       .single();

//     if (error || !patients) {
//       return "Patient not found. Please contact us.";
//     }

//     // Log pain level
//     const { error: logError } = await supabase.from("patient_progress").insert({
//       clinic_id: clinicId,
//       patient_id: patients.id,
//       assessment_date: new Date().toISOString().split("T")[0],
//       pain_level: painLevel,
//       notes: "Pain level reported via SMS",
//     });

//     if (logError) {
//       console.error("Error logging pain level:", logError);
//     }

//     const painDescription =
//       painLevel <= 3 ? "low" : painLevel <= 6 ? "moderate" : "high";
//     return `Thank you, ${patients.first_name}. Pain level ${painLevel} (${painDescription}) recorded. A therapist will review this information.`;
//   } catch (error) {
//     console.error("Error handling pain level response:", error);
//     return "Unable to record pain level. Please contact us.";
//   }
// }

/**
 * Log inbound message to database
 */
async function logInboundMessage(
  webhookData: z.infer<typeof twilioInboundSchema>,
  clinicId: string,
  optAction: "opt_out" | "opt_in" | null
): Promise<void> {
  try {
    const supabase = await supabaseServer();

    // Find patient ID
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("phone", webhookData.From)
      .eq("clinic_id", clinicId)
      .single();

    await supabase.from("message_logs").insert({
      clinic_id: clinicId,
      patient_id: patient?.id,
      message_type: "sms_inbound",
      content: webhookData.Body,
      recipient: webhookData.To, // The clinic's number
      status: "received",
      twilio_sid: webhookData.MessageSid,
      sent_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
      notes: optAction ? `Opt action: ${optAction}` : "Inbound message",
    });
  } catch (error) {
    console.error("Error logging inbound message:", error);
  }
}

/**
 * GET /api/twilio/inbound
 * Get inbound message statistics and recent messages
 */
export async function GET(request: NextRequest) {
  try {
    // This endpoint could be used by the dashboard to show recent inbound messages
    const url = new URL(request.url);
    const clinicId = url.searchParams.get("clinicId");

    if (!clinicId) {
      return NextResponse.json(
        { error: "Clinic ID required" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    // Get recent inbound messages
    const { data: recentMessages } = await supabase
      .from("message_logs")
      .select(
        `
        id,
        content,
        sent_at,
        patients:patient_id (first_name, last_name, phone)
      `
      )
      .eq("clinic_id", clinicId)
      .eq("message_type", "sms_inbound")
      .order("sent_at", { ascending: false })
      .limit(50);

    // Get opt-out statistics
    const { data: optOutStats } = await supabase
      .from("patients")
      .select("opt_in_sms")
      .eq("clinic_id", clinicId);

    const totalPatients = optOutStats?.length || 0;
    const optedInPatients =
      optOutStats?.filter((p) => p.opt_in_sms).length || 0;
    const optedOutPatients = totalPatients - optedInPatients;

    return NextResponse.json({
      recentMessages: recentMessages || [],
      statistics: {
        totalPatients,
        optedInPatients,
        optedOutPatients,
        optInRate:
          totalPatients > 0
            ? ((optedInPatients / totalPatients) * 100).toFixed(1)
            : "0",
      },
    });
  } catch (error) {
    console.error("Inbound statistics error:", error);

    return NextResponse.json(
      { error: "Failed to get inbound statistics" },
      { status: 500 }
    );
  }
}
