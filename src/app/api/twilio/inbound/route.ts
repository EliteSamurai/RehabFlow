import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  parseOptMessage,
  updatePatientOptInStatus,
  sendOptOutConfirmation,
  sendOptInConfirmation,
  getClinicFromPhone,
} from "@/server/sms";
import { supabaseServer } from "@/server/supabase";

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

    if (optAction) {
      await handleOptAction(
        webhookData.From,
        clinicId,
        optAction,
        webhookData.MessageSid
      );
    } else {
      // Handle other types of inbound messages
      await handleGeneralInbound(
        webhookData.From,
        clinicId,
        webhookData.Body,
        webhookData.MessageSid
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
  phoneNumber: string,
  clinicId: string,
  action: "opt_out" | "opt_in"
): Promise<void> {
  try {
    const optedIn = action === "opt_in";

    // Update patient opt-in status
    const success = await updatePatientOptInStatus(
      phoneNumber,
      clinicId,
      optedIn
    );

    if (success) {
      // Send confirmation message
      if (action === "opt_out") {
        await sendOptOutConfirmation(phoneNumber, clinicId);
      } else {
        await sendOptInConfirmation(phoneNumber, clinicId);
      }

      console.log(`📱 Patient ${phoneNumber} ${action} processed successfully`);
    } else {
      console.error(`Failed to process ${action} for ${phoneNumber}`);
    }
  } catch (error) {
    console.error(`Error handling ${action}:`, error);
  }
}

/**
 * Handle general inbound messages (responses, questions, etc.)
 */
async function handleGeneralInbound(
  phoneNumber: string,
  clinicId: string,
  message: string
): Promise<void> {
  try {
    const supabase = await supabaseServer();

    // Find the patient
    const { data: patient } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("phone", phoneNumber)
      .eq("clinic_id", clinicId)
      .single();

    if (!patient) {
      console.log(`📱 Inbound message from unknown number: ${phoneNumber}`);
      return;
    }

    // Check for common response patterns
    const normalizedMessage = message.toLowerCase().trim();

    // Handle appointment confirmations
    if (["yes", "confirm", "confirmed", "ok"].includes(normalizedMessage)) {
      await handleAppointmentConfirmation(patient.id, clinicId);
    }

    // Handle exercise completion
    else if (["done", "completed", "finished"].includes(normalizedMessage)) {
      await handleExerciseCompletion(patient.id, clinicId);
    }

    // Handle pain level responses (0-10)
    else if (/^([0-9]|10)$/.test(normalizedMessage)) {
      await handlePainLevelResponse(
        patient.id,
        clinicId,
        parseInt(normalizedMessage)
      );
    }

    // General response - log for manual review
    else {
      console.log(
        `📱 General response from ${patient.first_name} ${patient.last_name}: ${message}`
      );
    }
  } catch (error) {
    console.error("Error handling general inbound:", error);
  }
}

/**
 * Handle appointment confirmation responses
 */
async function handleAppointmentConfirmation(
  patientId: string,
  clinicId: string
): Promise<void> {
  try {
    const supabase = await supabaseServer();

    // Find the most recent scheduled appointment for this patient
    const { data: appointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("patient_id", patientId)
      .eq("clinic_id", clinicId)
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .single();

    if (appointment) {
      await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", appointment.id);

      console.log(`✅ Appointment ${appointment.id} confirmed via SMS`);
    }
  } catch (error) {
    console.error("Error handling appointment confirmation:", error);
  }
}

/**
 * Handle exercise completion responses
 */
async function handleExerciseCompletion(
  patientId: string,
  clinicId: string
): Promise<void> {
  try {
    const supabase = await supabaseServer();

    // Log exercise completion
    await supabase.from("exercise_completions").insert({
      clinic_id: clinicId,
      patient_id: patientId,
      completed_at: new Date().toISOString(),
      compliance_score: 1.0, // Full compliance for SMS response
      notes: `Completed via SMS response`,
    });

    console.log(`💪 Exercise completion logged for patient ${patientId}`);
  } catch (error) {
    console.error("Error handling exercise completion:", error);
  }
}

/**
 * Handle pain level responses
 */
async function handlePainLevelResponse(
  patientId: string,
  clinicId: string,
  painLevel: number
): Promise<void> {
  try {
    const supabase = await supabaseServer();

    // Log pain level
    await supabase.from("patient_progress").insert({
      clinic_id: clinicId,
      patient_id: patientId,
      assessment_date: new Date().toISOString().split("T")[0],
      pain_level: painLevel,
      notes: `Pain level reported via SMS (${messageSid})`,
    });

    console.log(`📊 Pain level ${painLevel} recorded for patient ${patientId}`);
  } catch (error) {
    console.error("Error handling pain level response:", error);
  }
}

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
