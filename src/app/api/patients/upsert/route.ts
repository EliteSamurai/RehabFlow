import { NextRequest, NextResponse } from "next/server";
import { withServiceRole } from "@/server/supabase-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatientUpsertData {
  phone: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  primary_condition?: string | null;
  referral_source?: string | null;
  opt_in_sms: boolean;
  opt_in_email: boolean;
}

// Helper function to validate UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientData, clinicId } = body;

    if (!patientData || !clinicId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: patientData and clinicId",
        },
        { status: 400 }
      );
    }

    // Validate clinic ID format
    if (!isValidUUID(clinicId)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid clinic ID format: ${clinicId}. Expected a valid UUID.`,
        },
        { status: 400 }
      );
    }

    const patient: PatientUpsertData = {
      phone: patientData.phone,
      first_name: patientData.first_name,
      last_name: patientData.last_name,
      email: patientData.email || null,
      date_of_birth: patientData.date_of_birth || null,
      gender: patientData.gender || null,
      primary_condition: patientData.primary_condition || null,
      referral_source: patientData.referral_source || null,
      opt_in_sms: patientData.opt_in_sms ?? true,
      opt_in_email: patientData.opt_in_email ?? false,
    };

    // Validate required fields
    if (!patient.phone || !patient.first_name || !patient.last_name) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone, first_name, and last_name are required",
        },
        { status: 400 }
      );
    }

    // Validate E.164 phone format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(patient.phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone must be in E.164 format (e.g., +1234567890)",
        },
        { status: 400 }
      );
    }

    // Upsert patient using service role
    const result = await withServiceRole(async (supabase) => {
      // Check if patient already exists by phone number and clinic
      const { data: existingPatient, error: selectError } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email")
        .eq("clinic_id", clinicId)
        .eq("phone", patient.phone)
        .single();

      // Type assertion for existingPatient
      const typedExistingPatient = existingPatient as {
        id: string;
        first_name: string;
        last_name: string;
        email: string | null;
      } | null;

      if (selectError && selectError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected for new patients
        throw selectError;
      }

      if (typedExistingPatient) {
        // Update existing patient
        const updateData = {
          first_name: patient.first_name,
          last_name: patient.last_name,
          email: patient.email,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          primary_condition: patient.primary_condition,
          referral_source: patient.referral_source,
          opt_in_sms: patient.opt_in_sms,
          opt_in_email: patient.opt_in_email,
          updated_at: new Date().toISOString(),
        };

        const { data: updatedPatient, error: updateError } =
          await // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from("patients")
            .update(updateData)
            .eq("id", typedExistingPatient.id)
            .select()
            .single();

        if (updateError) throw updateError;

        return {
          action: "updated",
          patient: updatedPatient,
          existingData: typedExistingPatient,
        };
      } else {
        // Insert new patient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newPatient, error: insertError } = await (supabase as any)
          .from("patients")
          .insert({
            clinic_id: clinicId,
            phone: patient.phone,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            date_of_birth: patient.date_of_birth,
            gender: patient.gender,
            primary_condition: patient.primary_condition,
            referral_source: patient.referral_source,
            opt_in_sms: patient.opt_in_sms,
            opt_in_email: patient.opt_in_email,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return {
          action: "created",
          patient: newPatient,
        };
      }
    }, "patient_upsert");

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
