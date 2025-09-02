"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/server/supabase";
import { requireUser } from "@/lib/auth";
import {
  createPatientSchema,
  updatePatientSchema,
  patientSearchSchema,
  type CreatePatientInput,
  type UpdatePatientInput,
  type PatientSearchInput,
  type Patient,
} from "@/lib/validations/patient";
import { withServiceRole } from "@/server/supabase-service";

async function getUserClinicId(userId: string): Promise<string> {
  const supabase = await supabaseServer();

  // First try to get clinic from clinic_users table
  const { data: clinicUser } = await supabase
    .from("clinic_users")
    .select("clinic_id")
    .eq("user_id", userId)
    .single();

  if (clinicUser) {
    return clinicUser.clinic_id;
  }

  // Fallback to user ID if no clinic membership found
  return userId;
}

export interface PaginatedPatients {
  patients: Patient[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getPatients(
  searchParams?: PatientSearchInput
): Promise<PaginatedPatients> {
  try {
    const user = await requireUser();
    const supabase = await supabaseServer();

    // Get clinic_id from user metadata or fallback to user.id
    const clinicId = await getUserClinicId(user.id);

    // Validate and set defaults for search params
    const {
      search = "",
      sortBy = "created_at",
      sortOrder = "desc",
      page = 1,
      pageSize = 20,
      condition,
      optInSms,
    } = patientSearchSchema.parse(searchParams || {});

    // Build the base query with RLS
    let query = supabase
      .from("patients")
      .select("*", { count: "exact" })
      .eq("clinic_id", clinicId);

    // Apply search filter
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,primary_condition.ilike.%${search}%`
      );
    }

    // Apply condition filter
    if (condition) {
      query = query.ilike("primary_condition", `%${condition}%`);
    }

    // Apply SMS opt-in filter
    if (optInSms !== undefined) {
      query = query.eq("opt_in_sms", optInSms);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching patients:", error);
      throw new Error("Failed to fetch patients");
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      patients: data || [],
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error("Get patients error:", error);
    throw new Error("Failed to fetch patients");
  }
}

export async function getPatient(id: string): Promise<Patient | null> {
  try {
    const user = await requireUser();
    const supabase = await supabaseServer();
    const clinicId = await getUserClinicId(user.id);

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .eq("clinic_id", clinicId) // RLS: only access own clinic's patients
      .single();

    if (error) {
      console.error("Error fetching patient:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Get patient error:", error);
    return null;
  }
}

export async function createPatient(
  input: CreatePatientInput
): Promise<{ success: boolean; error?: string; data?: Patient }> {
  try {
    const user = await requireUser();
    const supabase = await supabaseServer();
    const clinicId = await getUserClinicId(user.id);

    // Validate input
    const validatedData = createPatientSchema.parse(input);

    // Check for duplicate phone number within clinic
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("phone", validatedData.phone)
      .single();

    if (existingPatient) {
      return {
        success: false,
        error: "A patient with this phone number already exists",
      };
    }

    // Sanitize data: convert empty strings to null for optional date fields
    const sanitizedData = {
      ...validatedData,
      date_of_birth: validatedData.date_of_birth || null,
      injury_date: validatedData.injury_date || null,
    };

    // Use withServiceRole to bypass RLS entirely
    const data = await withServiceRole(async (serviceSupabase) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (serviceSupabase as any)
        .from("patients")
        .insert({
          ...sanitizedData,
          clinic_id: clinicId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    }, "create-patient");

    revalidatePath("/patients");
    return { success: true, data };
  } catch (error) {
    console.error("Create patient error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create patient" };
  }
}

export async function updatePatient(
  id: string,
  input: UpdatePatientInput
): Promise<{ success: boolean; error?: string; data?: Patient }> {
  try {
    const user = await requireUser();
    const supabase = await supabaseServer();
    const clinicId = await getUserClinicId(user.id);

    // Validate input
    const validatedData = updatePatientSchema.parse(input);

    // Check for duplicate phone number (excluding current patient)
    if (validatedData.phone) {
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("phone", validatedData.phone)
        .neq("id", id)
        .single();

      if (existingPatient) {
        return {
          success: false,
          error: "A patient with this phone number already exists",
        };
      }
    }

    const data = await withServiceRole(async (serviceSupabase) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (serviceSupabase as any)
        .from("patients")
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    }, "update-patient");

    revalidatePath("/patients");
    return { success: true, data };
  } catch (error) {
    console.error("Update patient error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update patient" };
  }
}

export async function deletePatient(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await supabaseServer();
    const clinicId = await getUserClinicId(user.id);

    // Check if patient has active appointments
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id")
      .eq("patient_id", id)
      .eq("clinic_id", clinicId)
      .gte("scheduled_at", new Date().toISOString())
      .limit(1);

    if (appointments && appointments.length > 0) {
      return {
        success: false,
        error:
          "Cannot delete patient with upcoming appointments. Please cancel appointments first.",
      };
    }

    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId); // RLS: only delete own clinic's patients

    if (error) {
      console.error("Error deleting patient:", error);
      return { success: false, error: "Failed to delete patient" };
    }

    revalidatePath("/patients");
    return { success: true };
  } catch (error) {
    console.error("Delete patient error:", error);
    return { success: false, error: "Failed to delete patient" };
  }
}

export async function getPatientStats(): Promise<{
  totalPatients: number;
  activePatients: number;
  optInSmsCount: number;
  optInEmailCount: number;
}> {
  try {
    const user = await requireUser();
    const supabase = await supabaseServer();
    const clinicId = await getUserClinicId(user.id);

    const { data, error } = await supabase
      .from("patients")
      .select("opt_in_sms, opt_in_email, created_at")
      .eq("clinic_id", clinicId);

    if (error) {
      console.error("Error fetching patient stats:", error);
      throw new Error("Failed to fetch patient statistics");
    }

    const totalPatients = data.length;
    const activePatients = data.filter(
      (p) =>
        new Date(p.created_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    ).length;
    const optInSmsCount = data.filter((p) => p.opt_in_sms).length;
    const optInEmailCount = data.filter((p) => p.opt_in_email).length;

    return {
      totalPatients,
      activePatients,
      optInSmsCount,
      optInEmailCount,
    };
  } catch (error) {
    console.error("Get patient stats error:", error);
    return {
      totalPatients: 0,
      activePatients: 0,
      optInSmsCount: 0,
      optInEmailCount: 0,
    };
  }
}
