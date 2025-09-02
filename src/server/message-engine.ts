/* eslint-disable @typescript-eslint/no-explicit-any */
import { withServiceRole } from "@/server/supabase-service";
import { sendSMS } from "@/server/sms";

export interface DueReminder {
  id: string;
  type: "appointment_reminder" | "campaign_step" | "no_show_recovery";
  appointment_id?: string;
  campaign_id?: string;
  patient_id: string;
  clinic_id: string;
  recipient_phone: string;
  message_content: string;
  scheduled_for: string;
  reminder_type?: "24h" | "4h" | "1h";
  template_id?: string;
  no_show_step?: number; // 1-4 for no-show recovery sequence
}

export interface MessageDispatchResult {
  success: boolean;
  processed: number;
  errors: Array<{
    reminder_id: string;
    error: string;
  }>;
}

/**
 * Query for appointment reminders that are due to be sent
 * Checks for appointments within reminder windows (24h, 4h, 1h before)
 */
export async function getDueAppointmentReminders(): Promise<DueReminder[]> {
  return withServiceRole(async (supabase) => {
    // Use service role to access all clinics across tenants
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        clinic_id,
        patient_id,
        scheduled_at,
        appointment_type,
        patients!inner (
          first_name,
          last_name,
          phone,
          opt_in_sms
        ),
        clinics!inner (
          name,
          timezone
        )
      `
      )
      .eq("status", "scheduled")
      .eq("patients.opt_in_sms", true)
      .gte("scheduled_at", new Date().toISOString())
      .lte(
        "scheduled_at",
        new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
      ); // Next 25 hours

    if (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }

    const dueReminders: DueReminder[] = [];
    const now = new Date();

    for (const appointment of (appointments as Array<{
      id: string;
      clinic_id: string;
      patient_id: string;
      scheduled_at: string;
      patients: {
        first_name: string;
        last_name: string;
        phone: string;
        opt_in_sms: boolean;
      };
      clinics: { name: string; timezone: string };
    }>) || []) {
      const scheduledAt = new Date(appointment.scheduled_at);
      const patient = appointment.patients;
      const clinic = appointment.clinics;

      // Skip if patient hasn't opted in to SMS
      if (!patient.opt_in_sms) continue;

      // Calculate time differences
      const timeDiff = scheduledAt.getTime() - now.getTime();
      const hours = timeDiff / (1000 * 60 * 60);

      let reminderType: "24h" | "4h" | "1h" | null = null;

      // Determine which reminder window we're in
      if (hours <= 25 && hours > 23) {
        reminderType = "24h";
      } else if (hours <= 4.5 && hours > 3.5) {
        reminderType = "4h";
      } else if (hours <= 1.5 && hours > 0.5) {
        reminderType = "1h";
      }

      if (!reminderType) continue;

      // Check if reminder was already sent
      const { data: existingLog } = await supabase
        .from("message_logs")
        .select("id")
        .eq("appointment_id", appointment.id)
        .eq("message_type", "sms")
        .like("content", `%${reminderType}%`)
        .single();

      if (existingLog) continue; // Already sent

      // Generate reminder message based on type
      let messageContent = "";
      switch (reminderType) {
        case "24h":
          messageContent = `Hi ${patient.first_name}! This is a reminder that you have an appointment at ${clinic.name} tomorrow at ${scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Please bring your insurance card and wear comfortable clothing. Reply STOP to opt out.`;
          break;
        case "4h":
          messageContent = `Hi ${patient.first_name}! Your appointment at ${clinic.name} is in 4 hours at ${scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. See you soon! Reply STOP to opt out.`;
          break;
        case "1h":
          messageContent = `Hi ${patient.first_name}! Your appointment at ${clinic.name} is in 1 hour. We're looking forward to seeing you! Reply STOP to opt out.`;
          break;
      }

      dueReminders.push({
        id: `apt_${appointment.id}_${reminderType}`,
        type: "appointment_reminder",
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        clinic_id: appointment.clinic_id,
        recipient_phone: patient.phone,
        message_content: messageContent,
        scheduled_for: scheduledAt.toISOString(),
        reminder_type: reminderType,
      });
    }

    return dueReminders;
  }, "getDueAppointmentReminders");
}

/**
 * Query for campaign messages that are due to be sent
 * Checks for active campaign steps whose scheduled time has elapsed
 */
export async function getDueCampaignMessages(): Promise<DueReminder[]> {
  return withServiceRole(async () => {
    // For MVP, we'll implement a basic campaign system
    // This would be expanded based on the campaign schema in the PRD

    // Placeholder for now - in production this would query campaign_enrollments
    // and check for due message steps based on enrollment date + step delays
    const dueMessages: DueReminder[] = [];

    // TODO: Implement when campaign system is built
    // const { data: campaignSteps } = await supabase
    //   .from('campaign_enrollments')
    //   .select(`
    //     *,
    //     campaigns(*),
    //     patients(*)
    //   `)
    //   .eq('status', 'active')
    //   .lte('next_message_at', new Date().toISOString());

    return dueMessages;
  }, "getDueCampaignMessages");
}

/**
 * Detect and mark appointments as no-shows
 * Marks appointments as no-show if now > scheduled_at + 2h and status is still 'scheduled'
 */
export async function detectAndMarkNoShows(): Promise<{
  marked: number;
  errors: Array<{ appointment_id: string; error: string }>;
}> {
  return withServiceRole(async (supabase) => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Find appointments that are 2+ hours past scheduled time and still marked as 'scheduled'
    const { data: overdueAppointments, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        clinic_id,
        patient_id,
        scheduled_at,
        patients!inner (
          first_name,
          last_name,
          phone,
          opt_in_sms
        ),
        clinics!inner (
          name
        )
      `
      )
      .eq("status", "scheduled")
      .lt("scheduled_at", twoHoursAgo.toISOString());

    if (error) {
      console.error("Error fetching overdue appointments:", error);
      return { marked: 0, errors: [] };
    }

    if (!overdueAppointments || overdueAppointments.length === 0) {
      return { marked: 0, errors: [] };
    }

    console.log(
      `Found ${overdueAppointments.length} overdue appointments to mark as no-shows`
    );

    let marked = 0;
    const errors: Array<{ appointment_id: string; error: string }> = [];

    for (const appointment of (overdueAppointments as Array<{
      id: string;
      clinic_id: string;
      patient_id: string;
      scheduled_at: string;
      patients: {
        first_name: string;
        last_name: string;
        phone: string;
        opt_in_sms: boolean;
      };
      clinics: { name: string };
    }>) || []) {
      try {
        // Mark appointment as no-show
        const { error: updateError } = await (supabase as any)
          .from("appointments")
          .update({
            status: "no_show",
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointment.id);

        if (updateError) {
          errors.push({
            appointment_id: appointment.id,
            error: `Failed to update status: ${updateError.message}`,
          });
          continue;
        }

        // Check if patient has opted in to SMS
        if (!appointment.patients.opt_in_sms) {
          console.log(
            `Patient ${appointment.patients.first_name} ${appointment.patients.last_name} has not opted in to SMS - skipping no-show recovery`
          );
          continue;
        }

        // Create no-show recovery campaign enrollment
        const { error: campaignError } = await (supabase as any)
          .from("campaign_enrollments")
          .insert({
            clinic_id: appointment.clinic_id,
            patient_id: appointment.patient_id,
            campaign_id: null, // Will be set after campaign lookup
            status: "active",
            enrolled_at: new Date().toISOString(),
            next_message_at: new Date().toISOString(), // Start immediately
            current_step: 1,
            metadata: {
              appointment_id: appointment.id,
              original_scheduled_at: appointment.scheduled_at,
              clinic_name: appointment.clinics.name,
              patient_name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
              no_show_detected_at: now.toISOString(),
              campaign_type: "no_show_recovery", // Use this to identify the campaign type
            },
          });

        if (campaignError) {
          errors.push({
            appointment_id: appointment.id,
            error: `Failed to create campaign enrollment: ${campaignError.message}`,
          });
          continue;
        }

        marked++;
        console.log(
          `✓ Marked appointment ${appointment.id} as no-show and enrolled in recovery campaign`
        );
      } catch (error) {
        errors.push({
          appointment_id: appointment.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(
          `✗ Error processing no-show for appointment ${appointment.id}:`,
          error
        );
      }
    }

    return { marked, errors };
  }, "detectAndMarkNoShows");
}

/**
 * Query for no-show recovery messages that are due to be sent
 * Implements the 4-step no-show recovery sequence with enhanced idempotency
 */
export async function getDueNoShowRecoveryMessages(): Promise<DueReminder[]> {
  return withServiceRole(async (supabase) => {
    const now = new Date();

    // Find active no-show recovery enrollments that are due for next message
    const { data: enrollments, error } = await supabase
      .from("campaign_enrollments")
      .select(
        `
        id,
        clinic_id,
        patient_id,
        current_step,
        next_message_at,
        metadata,
        patients!inner (
          first_name,
          last_name,
          phone,
          opt_in_sms
        ),
        clinics!inner (
          name
        )
      `
      )
      .eq("metadata->>campaign_type", "no_show_recovery") // Look for no-show recovery by type
      .eq("status", "active")
      .eq("patients.opt_in_sms", true)
      .lte("next_message_at", now.toISOString());

    if (error) {
      console.error("Error fetching no-show recovery enrollments:", error);
      return [];
    }

    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    console.log(
      `📧 Found ${enrollments.length} no-show recovery messages due to be sent`
    );

    const dueMessages: DueReminder[] = [];

    for (const enrollment of enrollments as Array<{
      id: string;
      clinic_id: string;
      patient_id: string;
      current_step: number;
      next_message_at: string;
      metadata: Record<string, unknown>;
      patients: {
        first_name: string;
        last_name: string;
        phone: string;
        opt_in_sms: boolean;
      };
      clinics: { name: string };
    }>) {
      const patient = enrollment.patients;
      const clinic = enrollment.clinics;
      const metadata = enrollment.metadata || {};

      // Skip if patient hasn't opted in to SMS
      if (!patient.opt_in_sms) continue;

      // Create unique message key for idempotency
      const messageKey = `no_show_recovery_${enrollment.patient_id}_${metadata.appointment_id}_step_${enrollment.current_step}`;

      // Check if this specific message was already sent (idempotency)
      const { data: existingLog } = await supabase
        .from("message_logs")
        .select("id")
        .eq("clinic_id", enrollment.clinic_id)
        .eq("patient_id", enrollment.patient_id)
        .eq("appointment_id", metadata.appointment_id as string)
        .eq("metadata->>message_key", messageKey)
        .single();

      if (existingLog) {
        console.log(
          `⏭️  No-show recovery step ${enrollment.current_step} already sent for patient ${patient.first_name} ${patient.last_name} (key: ${messageKey})`
        );
        continue;
      }

      // Generate message based on current step
      let messageContent = "";

      switch (enrollment.current_step) {
        case 1: // Immediate follow-up (15 min after no-show)
          messageContent = `Hi ${patient.first_name}, we missed you at your appointment today at ${clinic.name}. We're concerned about your recovery progress. Please call us to reschedule or reply YES to confirm you're okay. Reply STOP to opt out.`;
          break;

        case 2: // 24h follow-up
          messageContent = `Hi ${patient.first_name}, it's been 24 hours since your missed appointment. Your recovery is important to us. Please call ${clinic.name} to reschedule or reply YES if you need help. Reply STOP to opt out.`;
          break;

        case 3: // 48h follow-up
          messageContent = `Hi ${patient.first_name}, we're reaching out because we care about your recovery. Missing appointments can delay your progress. Please call us at ${clinic.name} to discuss your treatment plan. Reply STOP to opt out.`;
          break;

        case 4: // 7-day follow-up
          messageContent = `Hi ${patient.first_name}, we want to ensure you're on track with your recovery goals. Please call ${clinic.name} to discuss your progress and reschedule if needed. We're here to help! Reply STOP to opt out.`;
          break;

        default:
          console.warn(
            `⚠️  Invalid no-show recovery step: ${enrollment.current_step}`
          );
          continue;
      }

      if (messageContent) {
        dueMessages.push({
          id: messageKey,
          type: "no_show_recovery",
          appointment_id: metadata.appointment_id as string,
          patient_id: enrollment.patient_id,
          clinic_id: enrollment.clinic_id,
          recipient_phone: patient.phone,
          message_content: messageContent,
          scheduled_for: now.toISOString(),
          no_show_step: enrollment.current_step,
        });
      }
    }

    console.log(
      `📤 Generated ${dueMessages.length} no-show recovery messages for dispatch`
    );

    return dueMessages;
  }, "getDueNoShowRecoveryMessages");
}

/**
 * Advance campaign step to next step
 * Simple implementation for non-no-show campaigns
 */
async function advanceCampaignStep(reminder: DueReminder): Promise<void> {
  if (!reminder.campaign_id) {
    return;
  }

  return withServiceRole(async () => {
    try {
      // For now, just log that we would advance the campaign
      // In a full implementation, this would update campaign_enrollments
      console.log(
        `📈 Would advance campaign ${reminder.campaign_id} for patient ${reminder.patient_id}`
      );
    } catch (error) {
      console.error(
        `❌ Error advancing campaign step for reminder ${reminder.id}:`,
        error
      );
    }
  }, "advanceCampaignStep");
}

/**
 * Advance no-show recovery campaign to next step
 * Uses the delay logic from the message generation
 */
async function advanceNoShowRecoveryStep(reminder: DueReminder): Promise<void> {
  if (
    !reminder.appointment_id ||
    !reminder.patient_id ||
    !reminder.no_show_step
  ) {
    return;
  }

  return withServiceRole(async (supabase) => {
    try {
      const currentStep = reminder.no_show_step;

      // Type guard to ensure currentStep is defined
      if (typeof currentStep !== "number") {
        console.error("Invalid no_show_step:", currentStep);
        return;
      }

      // Check if this is the final step
      if (currentStep === 4) {
        // Final step completed, mark campaign as completed
        await (supabase as any)
          .from("campaign_enrollments")
          .update({
            status: "completed",
            current_step: currentStep + 1,
            next_message_at: new Date(
              Date.now() + 1000 * 60 * 60 * 24 * 365
            ).toISOString(), // Far future
            updated_at: new Date().toISOString(),
          })
          .eq("metadata->>campaign_type", "no_show_recovery") // Use campaign type
          .eq("patient_id", reminder.patient_id)
          .eq("metadata->>appointment_id", reminder.appointment_id);

        console.log(
          `✅ Completed no-show recovery campaign for patient ${reminder.patient_id}`
        );
      } else {
        // Calculate delay based on current step
        let delayMinutes = 0;
        switch (currentStep) {
          case 1:
            delayMinutes = 60; // 1 hour
            break;
          case 2:
            delayMinutes = 1440; // 24 hours
            break;
          case 3:
            delayMinutes = 1440; // 24 hours
            break;
          default:
            delayMinutes = 1440; // Default to 24 hours
        }

        const nextMessageAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        // Advance to next step with appropriate delay
        await (supabase as any)
          .from("campaign_enrollments")
          .update({
            current_step: currentStep + 1,
            next_message_at: nextMessageAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("metadata->>campaign_type", "no_show_recovery") // Use campaign type
          .eq("patient_id", reminder.patient_id)
          .eq("metadata->>appointment_id", reminder.appointment_id);

        console.log(
          `⏭️  Advanced no-show recovery to step ${currentStep + 1} for patient ${reminder.patient_id}, next message at ${nextMessageAt.toISOString()}`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error advancing no-show recovery step for patient ${reminder.patient_id}:`,
        error
      );
    }
  }, "advanceNoShowRecoveryStep");
}

/**
 * Main function to process all due reminders and messages
 * Includes appointment reminders, campaign steps, and no-show recovery
 */
export async function processDueReminders(): Promise<MessageDispatchResult> {
  return withServiceRole(async (supabase) => {
    console.log(
      "🚀 Starting message dispatch process:",
      new Date().toISOString()
    );

    const result: MessageDispatchResult = {
      success: true,
      processed: 0,
      errors: [],
    };

    try {
      // Step 1: Run no-show detection job
      console.log("🔍 Step 1: Running no-show detection...");
      const noShowResult = await processNoShowDetection();
      console.log("📊 No-show detection results:", noShowResult);

      // Step 2: Get all due reminders (appointments + campaigns + no-show recovery)
      console.log("📋 Step 2: Fetching due reminders...");
      const [appointmentReminders, campaignSteps, noShowRecoveryMessages] =
        await Promise.all([
          getDueAppointmentReminders(),
          getDueCampaignMessages(),
          getDueNoShowRecoveryMessages(),
        ]);

      const allReminders = [
        ...appointmentReminders,
        ...campaignSteps,
        ...noShowRecoveryMessages,
      ];

      console.log(
        `📨 Total reminders to process: ${allReminders.length} (appointments: ${appointmentReminders.length}, campaigns: ${campaignSteps.length}, no-show recovery: ${noShowRecoveryMessages.length})`
      );

      if (allReminders.length === 0) {
        console.log("✅ No reminders to process");
        return result;
      }

      // Step 3: Process each reminder
      console.log("📤 Step 3: Processing reminders...");
      for (const reminder of allReminders) {
        try {
          // Check if message was already sent (idempotency)
          const messageKey =
            reminder.type === "no_show_recovery"
              ? reminder.id
              : `${reminder.clinic_id}_${reminder.appointment_id || reminder.campaign_id}_${reminder.template_id || reminder.type}`;

          // Build query conditionally to handle null values
          let query = supabase
            .from("message_logs")
            .select("id")
            .eq("clinic_id", reminder.clinic_id)
            .eq("patient_id", reminder.patient_id)
            .eq("metadata->>message_key", messageKey);

          if (reminder.appointment_id) {
            query = query.eq("appointment_id", reminder.appointment_id);
          }
          if (reminder.campaign_id) {
            query = query.eq("campaign_id", reminder.campaign_id);
          }

          const { data: existingLog } = await query.single();

          if (existingLog) {
            console.log(
              `⏭️  Message already sent for ${reminder.type} (key: ${messageKey}), skipping`
            );
            continue;
          }

          // Send the message
          const smsResult = await sendSMS({
            to: reminder.recipient_phone,
            message: reminder.message_content,
            clinicId: reminder.clinic_id,
            patientId: reminder.patient_id,
            appointmentId: reminder.appointment_id,
            campaignId: reminder.campaign_id,
            templateId: reminder.template_id,
            messageType:
              reminder.type === "no_show_recovery" ? "compliance" : "reminder",
            metadata: {
              message_key: messageKey,
              reminder_type: reminder.type,
              no_show_step: reminder.no_show_step,
              scheduled_for: reminder.scheduled_for,
            },
          });

          if (smsResult.success) {
            // Log successful message
            await (supabase as any).from("message_logs").insert({
              clinic_id: reminder.clinic_id,
              patient_id: reminder.patient_id,
              appointment_id: reminder.appointment_id,
              campaign_id: reminder.campaign_id,
              template_id: reminder.template_id,
              message_type: "sms",
              content: reminder.message_content,
              recipient: reminder.recipient_phone,
              status: "sent",
              twilio_sid: smsResult.messageId,
              metadata: {
                message_key: messageKey,
                reminder_type: reminder.type,
                no_show_step: reminder.no_show_step,
                scheduled_for: reminder.scheduled_for,
              },
            });

            // Advance campaign steps if applicable
            if (
              reminder.type === "campaign_step" ||
              reminder.type === "no_show_recovery"
            ) {
              if (reminder.type === "no_show_recovery") {
                await advanceNoShowRecoveryStep(reminder);
              } else {
                await advanceCampaignStep(reminder);
              }
            }

            result.processed++;
            console.log(
              `✅ Sent ${reminder.type} message to ${reminder.recipient_phone}`
            );
          } else {
            // Log failed message
            await (supabase as any).from("message_logs").insert({
              clinic_id: reminder.clinic_id,
              patient_id: reminder.patient_id,
              appointment_id: reminder.appointment_id,
              campaign_id: reminder.campaign_id,
              template_id: reminder.template_id,
              message_type: "sms",
              content: reminder.message_content,
              recipient: reminder.recipient_phone,
              status: "failed",
              error_message: smsResult.error,
              metadata: {
                message_key: messageKey,
                reminder_type: reminder.type,
                no_show_step: reminder.no_show_step,
                scheduled_for: reminder.scheduled_for,
              },
            });

            result.errors.push({
              reminder_id: reminder.id,
              error: smsResult.error || "Unknown SMS error",
            });

            console.error(
              `❌ Failed to send ${reminder.type} message to ${reminder.recipient_phone}: ${smsResult.error}`
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          result.errors.push({
            reminder_id: reminder.id,
            error: errorMessage,
          });

          console.error(`❌ Error processing reminder ${reminder.id}:`, error);
        }
      }

      console.log(
        `🎯 Message dispatch completed: ${result.processed} processed, ${result.errors.length} errors`
      );

      return result;
    } catch (error) {
      console.error("❌ Fatal error in message dispatch:", error);
      result.success = false;
      result.errors.push({
        reminder_id: "system",
        error: error instanceof Error ? error.message : "Unknown system error",
      });
      return result;
    }
  }, "processDueReminders");
}

/**
 * Health check for the message engine
 */
export async function getMessageEngineStatus() {
  return withServiceRole(async (supabase) => {
    try {
      console.log("🔍 Starting message engine health check...");

      // Check database connectivity with service role
      console.log("🔍 Testing database connection with service role...");
      const { error } = await supabase.from("clinics").select("id").limit(1);

      if (error) {
        console.error("❌ Database connection test failed:", error);
        throw error;
      }

      console.log("✅ Database connection test passed");

      // Check for pending messages
      console.log("🔍 Checking appointment reminders...");
      const appointmentReminders = await getDueAppointmentReminders();
      console.log(
        `✅ Appointment reminders check completed: ${appointmentReminders.length} found`
      );

      console.log("🔍 Checking campaign messages...");
      const campaignMessages = await getDueCampaignMessages();
      console.log(
        `✅ Campaign messages check completed: ${campaignMessages.length} found`
      );

      const result = {
        status: "healthy" as const,
        database_connected: true,
        pending_appointment_reminders: appointmentReminders.length,
        pending_campaign_messages: campaignMessages.length,
        total_pending: appointmentReminders.length + campaignMessages.length,
        last_check: new Date().toISOString(),
      };

      console.log(
        "✅ Message engine health check completed successfully:",
        result
      );
      return result;
    } catch (error) {
      console.error("❌ Message engine health check failed:", error);
      return {
        status: "error" as const,
        database_connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        last_check: new Date().toISOString(),
      };
    }
  }, "getMessageEngineStatus");
}

/**
 * Dedicated job to detect and mark appointments as no-show
 * Marks appointments as no-show if now > scheduled_at + 2h and status is still 'scheduled'
 * Then enqueues the 4-step no-show recovery sequence
 * Ensures idempotency using message_logs unique keys
 */
export async function processNoShowDetection(): Promise<{
  detected: number;
  marked: number;
  enrolled: number;
  errors: Array<{ appointment_id: string; error: string }>;
}> {
  return withServiceRole(async (supabase) => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    console.log("🔍 Running no-show detection job:", now.toISOString());

    // Find appointments that are 2+ hours overdue and still scheduled
    const { data: overdueAppointments, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        clinic_id,
        patient_id,
        scheduled_at,
        status,
        patients!inner (
          first_name,
          last_name,
          phone,
          opt_in_sms
        ),
        clinics!inner (
          name
        )
      `
      )
      .eq("status", "scheduled")
      .lt("scheduled_at", twoHoursAgo.toISOString());

    if (error) {
      console.error("Error fetching overdue appointments:", error);
      return { detected: 0, marked: 0, enrolled: 0, errors: [] };
    }

    if (!overdueAppointments || overdueAppointments.length === 0) {
      console.log("✅ No overdue appointments found");
      return { detected: 0, marked: 0, enrolled: 0, errors: [] };
    }

    console.log(
      `📋 Found ${overdueAppointments.length} overdue appointments to process`
    );

    let detected = 0;
    let marked = 0;
    let enrolled = 0;
    const errors: Array<{ appointment_id: string; error: string }> = [];

    for (const appointment of (overdueAppointments as Array<{
      id: string;
      clinic_id: string;
      patient_id: string;
      scheduled_at: string;
      status: string;
      patients: {
        first_name: string;
        last_name: string;
        phone: string;
        opt_in_sms: boolean;
      };
      clinics: { name: string };
    }>) || []) {
      try {
        detected++;

        // Check if already processed (idempotency check)
        const { data: existingNoShow } = await supabase
          .from("message_logs")
          .select("id")
          .eq("appointment_id", appointment.id)
          .eq("metadata->>no_show_detected", "true")
          .single();

        if (existingNoShow) {
          console.log(
            `⏭️  Appointment ${appointment.id} already processed as no-show, skipping`
          );
          continue;
        }

        // Mark appointment as no-show
        const { error: updateError } = await (supabase as any)
          .from("appointments")
          .update({
            status: "no_show",
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointment.id);

        if (updateError) {
          errors.push({
            appointment_id: appointment.id,
            error: `Failed to update status: ${updateError.message}`,
          });
          continue;
        }

        marked++;
        console.log(`✅ Marked appointment ${appointment.id} as no-show`);

        // Check if patient has opted in to SMS
        if (!appointment.patients.opt_in_sms) {
          console.log(
            `📱 Patient ${appointment.patients.first_name} ${appointment.patients.last_name} has not opted in to SMS - skipping no-show recovery`
          );
          continue;
        }

        // Create no-show recovery campaign enrollment
        const { error: campaignError } = await (supabase as any)
          .from("campaign_enrollments")
          .insert({
            clinic_id: appointment.clinic_id,
            patient_id: appointment.patient_id,
            campaign_id: null, // Will be set after campaign lookup
            status: "active",
            enrolled_at: new Date().toISOString(),
            next_message_at: new Date().toISOString(), // Start immediately
            current_step: 1,
            metadata: {
              appointment_id: appointment.id,
              original_scheduled_at: appointment.scheduled_at,
              clinic_name: appointment.clinics.name,
              patient_name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
              no_show_detected_at: now.toISOString(),
              campaign_type: "no_show_recovery", // Use this to identify the campaign type
            },
          });

        if (campaignError) {
          errors.push({
            appointment_id: appointment.id,
            error: `Failed to create campaign enrollment: ${campaignError.message}`,
          });
          continue;
        }

        enrolled++;
        console.log(
          `📧 Enrolled patient ${appointment.patients.first_name} ${appointment.patients.last_name} in no-show recovery campaign`
        );

        // Log the no-show detection for idempotency
        await (supabase as any).from("message_logs").insert({
          clinic_id: appointment.clinic_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          campaign_id: "no_show_recovery",
          message_type: "system",
          content: `No-show detected for appointment scheduled at ${appointment.scheduled_at}`,
          recipient: appointment.patients.phone,
          status: "logged",
          metadata: {
            no_show_detected: "true",
            detection_timestamp: now.toISOString(),
            original_scheduled_at: appointment.scheduled_at,
          },
        });
      } catch (error) {
        errors.push({
          appointment_id: appointment.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(
          `❌ Error processing no-show for appointment ${appointment.id}:`,
          error
        );
      }
    }

    console.log(
      `📊 No-show detection job completed: ${detected} detected, ${marked} marked, ${enrolled} enrolled, ${errors.length} errors`
    );

    return { detected, marked, enrolled, errors };
  }, "processNoShowDetection");
}
