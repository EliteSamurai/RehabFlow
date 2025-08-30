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
      patients: { first_name: string; last_name: string; phone: string; opt_in_sms: boolean };
      clinics: { name: string };
    }>) || []) {
      try {
        // Mark appointment as no-show
        const { error: updateError } = await supabase
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
        const { error: campaignError } = await supabase
          .from("campaign_enrollments")
          .insert({
            clinic_id: appointment.clinic_id,
            patient_id: appointment.patient_id,
            campaign_id: "no_show_recovery", // This would be a real campaign ID in production
            status: "active",
            enrolled_at: new Date().toISOString(),
            next_message_at: new Date().toISOString(), // Start immediately
            current_step: 1,
            metadata: {
              appointment_id: appointment.id,
              original_scheduled_at: appointment.scheduled_at,
              clinic_name: appointment.clinics.name,
              patient_name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
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
 * Implements the 4-step no-show recovery sequence
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
      .eq("campaign_id", "no_show_recovery")
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

    const dueMessages: DueReminder[] = [];

    for (const enrollment of enrollments) {
      const patient = enrollment.patients;
      const clinic = enrollment.clinics;
      const metadata = enrollment.metadata || {};

      // Skip if patient hasn't opted in to SMS
      if (!patient.opt_in_sms) continue;

      // Check if this step was already sent (idempotency)
      const { data: existingLog } = await supabase
        .from("message_logs")
        .select("id")
        .eq("campaign_id", "no_show_recovery")
        .eq("patient_id", enrollment.patient_id)
        .eq("appointment_id", metadata.appointment_id)
        .eq("metadata->>no_show_step", enrollment.current_step.toString())
        .single();

      if (existingLog) {
        console.log(
          `No-show recovery step ${enrollment.current_step} already sent for patient ${patient.first_name} ${patient.last_name}`
        );
        continue;
      }

      // Generate message based on current step
      let messageContent = "";

      switch (enrollment.current_step) {
        case 1: // Immediate follow-up (15 min after no-show)
          messageContent = `Hi ${patient.first_name}, we missed you at your appointment today at ${clinic.name}. We're concerned about your recovery progress. Please call us to reschedule or reply YES to confirm you're okay. Reply STOP to opt out.`;
          // 1 hour delay
          break;

        case 2: // 24h follow-up
          messageContent = `Hi ${patient.first_name}, it's been 24 hours since your missed appointment. Your recovery is important to us. Please call ${clinic.name} to reschedule or reply YES if you need help. Reply STOP to opt out.`;
          // 24 hours delay
          break;

        case 3: // 48h follow-up
          messageContent = `Hi ${patient.first_name}, we're reaching out because we care about your recovery. Missing appointments can delay your progress. Please call us at ${clinic.name} to discuss your treatment plan. Reply STOP to opt out.`;
          // 24 hours delay
          break;

        case 4: // 7-day follow-up
          messageContent = `Hi ${patient.first_name}, we want to ensure you're on track with your recovery goals. Please call ${clinic.name} to discuss your progress and reschedule if needed. We're here to help! Reply STOP to opt out.`;
          // Final step - no more messages
          break;

        default:
          console.warn(
            `Invalid no-show recovery step: ${enrollment.current_step}`
          );
          continue;
      }

      if (messageContent) {
        dueMessages.push({
          id: `no_show_${enrollment.id}_step_${enrollment.current_step}`,
          type: "no_show_recovery",
          appointment_id: metadata.appointment_id,
          patient_id: enrollment.patient_id,
          clinic_id: enrollment.clinic_id,
          recipient_phone: patient.phone,
          message_content: messageContent,
          scheduled_for: now.toISOString(),
          no_show_step: enrollment.current_step,
        });
      }
    }

    return dueMessages;
  }, "getDueNoShowRecoveryMessages");
}

/**
 * Advance no-show recovery campaign to next step
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

      // Check if this is the final step
      if (currentStep === 4) {
        // Final step completed, mark campaign as completed
        // Final step completed, mark campaign as completed
        await supabase
          .from("campaign_enrollments")
          .update({
            status: "completed",
            current_step: currentStep + 1,
            next_message_at: new Date(
              Date.now() + 1000 * 60 * 60 * 24 * 365
            ).toISOString(), // Far future
          })
          .eq("campaign_id", "no_show_recovery")
          .eq("patient_id", reminder.patient_id)
          .eq("metadata->>appointment_id", reminder.appointment_id);

        console.log(
          `✓ Completed no-show recovery campaign for patient ${reminder.patient_id}`
        );
      } else {
        // Advance to next step with appropriate delay
        let delayMinutes = 0;
        switch (currentStep) {
          case 1:
            delayMinutes = 60;
            break; // 1 hour
          case 2:
            delayMinutes = 1440;
            break; // 24 hours
          case 3:
            delayMinutes = 1440;
            break; // 24 hours
          default:
            return;
        }

        const nextMessageAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        await supabase
          .from("campaign_enrollments")
          .update({
            current_step: currentStep + 1,
            next_message_at: nextMessageAt.toISOString(),
          })
          .eq("campaign_id", "no_show_recovery")
          .eq("patient_id", reminder.patient_id)
          .eq("metadata->>appointment_id", reminder.appointment_id);

        console.log(
          `✓ Advanced no-show recovery to step ${currentStep + 1} for patient ${reminder.patient_id}, next message at ${nextMessageAt.toISOString()}`
        );
      }
    } catch (error) {
      console.error(
        `✗ Failed to advance no-show recovery step for reminder ${reminder.id}:`,
        error
      );
    }
  }, "advanceNoShowRecoveryStep");
}

/**
 * Process and send all due reminders
 */
export async function processDueReminders(): Promise<MessageDispatchResult> {
  const appointmentReminders = await getDueAppointmentReminders();
  const campaignMessages = await getDueCampaignMessages();
  const noShowRecoveryMessages = await getDueNoShowRecoveryMessages();

  const allReminders = [
    ...appointmentReminders,
    ...campaignMessages,
    ...noShowRecoveryMessages,
  ];

  if (allReminders.length === 0) {
    return {
      success: true,
      processed: 0,
      errors: [],
    };
  }

  console.log(`Processing ${allReminders.length} due reminders...`);

  let processed = 0;
  const errors: Array<{ reminder_id: string; error: string }> = [];

  for (const reminder of allReminders) {
    try {
      // Send the SMS
      const result = await sendSMS({
        to: reminder.recipient_phone,
        message: reminder.message_content,
        clinicId: reminder.clinic_id,
        patientId: reminder.patient_id,
        appointmentId: reminder.appointment_id,
        campaignId: reminder.campaign_id,
        templateId: reminder.template_id,
        metadata:
          reminder.type === "no_show_recovery"
            ? {
                no_show_step: reminder.no_show_step,
                campaign_type: "no_show_recovery",
              }
            : undefined,
      });

      if (result.success) {
        processed++;
        console.log(
          `✓ Sent reminder ${reminder.id} to ${reminder.recipient_phone}`
        );

        // If this was a no-show recovery message, advance to next step
        if (reminder.type === "no_show_recovery" && reminder.no_show_step) {
          await advanceNoShowRecoveryStep(reminder);
        }
      } else {
        errors.push({
          reminder_id: reminder.id,
          error: result.error || "Unknown error",
        });
        console.error(
          `✗ Failed to send reminder ${reminder.id}:`,
          result.error
        );
      }
    } catch (error) {
      errors.push({
        reminder_id: reminder.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.error(`✗ Exception sending reminder ${reminder.id}:`, error);
    }

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    success: errors.length === 0,
    processed,
    errors,
  };
}

/**
 * Health check for the message engine
 */
export async function getMessageEngineStatus() {
  return withServiceRole(async (supabase) => {
    try {
      // Check database connectivity
      const { error } = await supabase.from("clinics").select("id").limit(1);

      if (error) throw error;

      // Check for pending messages
      const appointmentReminders = await getDueAppointmentReminders();
      const campaignMessages = await getDueCampaignMessages();

      return {
        status: "healthy" as const,
        database_connected: true,
        pending_appointment_reminders: appointmentReminders.length,
        pending_campaign_messages: campaignMessages.length,
        total_pending: appointmentReminders.length + campaignMessages.length,
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "error" as const,
        database_connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        last_check: new Date().toISOString(),
      };
    }
  }, "getMessageEngineStatus");
}
