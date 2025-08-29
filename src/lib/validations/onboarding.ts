import { z } from "zod";

// Step 1: Basic Signup
export const basicSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Step 2: Clinic Information
export const clinicInfoSchema = z.object({
  clinicName: z.string().min(1, "Clinic name is required"),
  clinicPhone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format (E.164)"),
  address: z.string().min(1, "Address is required"),
  timezone: z.string().min(1, "Timezone is required"),
  specialty: z.enum([
    "orthopedic",
    "sports",
    "neurological", 
    "pediatric",
    "geriatric",
    "cardiopulmonary",
    "other"
  ]),
});

// Step 3: User Setup
export const userSetupSchema = z.object({
  credentials: z.string().min(1, "Credentials are required"),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format"),
  profilePhoto: z.string().optional(),
});

// Step 4: SMS Consent & Compliance
export const complianceSchema = z.object({
  patientConsentConfirm: z.boolean().refine(val => val === true, {
    message: "You must confirm patient consent collection"
  }),
  hipaaGdprAgreement: z.boolean().refine(val => val === true, {
    message: "You must agree to HIPAA and GDPR compliance"
  }),
  baaUploaded: z.boolean().optional(),
});

// Step 5: Payment Setup
export const paymentSetupSchema = z.object({
  subscriptionTier: z.enum(["starter", "growth", "pro"]),
  stripePaymentMethodId: z.string().min(1, "Payment method is required"),
  useTrial: z.boolean().default(true),
});

// Step 6: Initial Configuration
export const configurationSchema = z.object({
  treatmentTypes: z.array(z.string()).min(1, "Select at least one treatment type"),
  businessHours: z.object({
    monday: z.object({ start: z.string(), end: z.string(), closed: z.boolean() }),
    tuesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean() }),
    wednesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean() }),
    thursday: z.object({ start: z.string(), end: z.string(), closed: z.boolean() }),
    friday: z.object({ start: z.string(), end: z.string(), closed: z.boolean() }),
    saturday: z.object({ start: z.string(), end: z.string(), closed: z.boolean() }),
    sunday: z.object({ start: z.string(), end: z.string(), closed: z.boolean() }),
  }),
  importPatients: z.enum(["csv", "manual", "skip"]),
});

// Step 8: Staff Invitations
export const staffInvitationSchema = z.object({
  invitations: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(["therapist", "assistant"]),
  })).optional(),
});

// Complete onboarding data
export const completeOnboardingSchema = z.object({
  step1: basicSignupSchema,
  step2: clinicInfoSchema,
  step3: userSetupSchema,
  step4: complianceSchema,
  step5: paymentSetupSchema,
  step6: configurationSchema,
  step8: staffInvitationSchema.optional(),
});

export type BasicSignupData = z.infer<typeof basicSignupSchema>;
export type ClinicInfoData = z.infer<typeof clinicInfoSchema>;
export type UserSetupData = z.infer<typeof userSetupSchema>;
export type ComplianceData = z.infer<typeof complianceSchema>;
export type PaymentSetupData = z.infer<typeof paymentSetupSchema>;
export type ConfigurationData = z.infer<typeof configurationSchema>;
export type StaffInvitationData = z.infer<typeof staffInvitationSchema>;
export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>;
