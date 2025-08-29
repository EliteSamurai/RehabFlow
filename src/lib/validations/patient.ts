import { z } from "zod";

export const patientSchema = z.object({
  id: z.string().uuid().optional(),
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format (E.164)"),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  address: z.string().max(200).optional(),
  emergency_contact: z
    .object({
      name: z.string().max(100).optional(),
      phone: z.string().max(20).optional(),
      relationship: z.string().max(50).optional(),
    })
    .optional(),
  primary_condition: z.string().max(255).optional(),
  injury_date: z.string().optional(),
  referral_source: z.string().max(100).optional(),
  insurance_info: z
    .object({
      provider: z.string().max(100).optional(),
      policy_number: z.string().max(50).optional(),
      group_number: z.string().max(50).optional(),
    })
    .optional(),
  goals: z.string().max(1000).optional(),
  opt_in_sms: z.boolean().default(true),
  opt_in_email: z.boolean().default(true),
  clinic_id: z.string().uuid().optional(), // Will be set server-side
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createPatientSchema = patientSchema.omit({
  id: true,
  clinic_id: true,
  created_at: true,
  updated_at: true,
});

export const updatePatientSchema = patientSchema.omit({
  clinic_id: true,
  created_at: true,
  updated_at: true,
});

export const patientSearchSchema = z.object({
  search: z.string().optional(),
  sortBy: z
    .enum(["first_name", "last_name", "created_at", "primary_condition"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  condition: z.string().optional(),
  optInSms: z.boolean().optional(),
});

export type Patient = z.infer<typeof patientSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientSearchInput = z.infer<typeof patientSearchSchema>;
