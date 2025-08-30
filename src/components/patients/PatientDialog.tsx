"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPatientSchema,
  updatePatientSchema,
  type CreatePatientInput,
  type UpdatePatientInput,
  type Patient,
} from "@/lib/validations/patient";
import { createPatient, updatePatient } from "@/lib/actions/patients";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Resolver } from "react-hook-form";

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
  onSuccess?: () => void;
}

export function PatientDialog({
  open,
  onOpenChange,
  patient,
  onSuccess,
}: PatientDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!patient;

  const createForm = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema) as Resolver<CreatePatientInput>,
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      gender: "male" as const,
      address: "",
      emergency_contact: {},
      primary_condition: "",
      injury_date: "",
      referral_source: "",
      insurance_info: {},
      goals: "",
      opt_in_sms: true,
      opt_in_email: true,
    },
  });

  const updateForm = useForm<UpdatePatientInput>({
    resolver: zodResolver(updatePatientSchema) as Resolver<UpdatePatientInput>,
    defaultValues: patient
      ? {
          id: patient.id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          email: patient.email || "",
          phone: patient.phone,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          address: patient.address || "",
          emergency_contact: patient.emergency_contact || {},
          primary_condition: patient.primary_condition || "",
          injury_date: patient.injury_date || "",
          referral_source: patient.referral_source || "",
          insurance_info: patient.insurance_info || {},
          goals: patient.goals || "",
          opt_in_sms: patient.opt_in_sms ?? true,
          opt_in_email: patient.opt_in_email ?? true,
        }
      : {
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          date_of_birth: "",
          gender: "male" as const,
          address: "",
          emergency_contact: {},
          primary_condition: "",
          injury_date: "",
          referral_source: "",
          insurance_info: {},
          goals: "",
          opt_in_sms: true,
          opt_in_email: true,
        },
  });

  const handleCreateSubmit = async (data: CreatePatientInput) => {
    setIsLoading(true);
    try {
      const result = await createPatient(data);
      if (!result.success) {
        toast.error(result.error || "Failed to create patient");
      } else {
        toast.success("Patient created successfully");
        onOpenChange(false);
        createForm.reset();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async (data: UpdatePatientInput) => {
    setIsLoading(true);
    try {
      if (!patient?.id) {
        toast.error("Patient ID is missing");
        return;
      }
      const result = await updatePatient(patient.id, data);
      if (!result.success) {
        toast.error(result.error || "Failed to update patient");
      } else {
        toast.success("Patient updated successfully");
        onOpenChange(false);
        updateForm.reset();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Patient" : "Add New Patient"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the patient's information below."
              : "Fill in the patient's information below."}
          </DialogDescription>
        </DialogHeader>

        <Form {...createForm}>
          <form
            onSubmit={
              isEdit
                ? updateForm.handleSubmit(
                    handleUpdateSubmit as SubmitHandler<UpdatePatientInput>
                  )
                : createForm.handleSubmit(
                    handleCreateSubmit as SubmitHandler<CreatePatientInput>
                  )
            }
            className="space-y-6"
          >
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={isEdit ? updateForm.control : createForm.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={isEdit ? updateForm.control : createForm.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={isEdit ? updateForm.control : createForm.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={isEdit ? updateForm.control : createForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">
                              Prefer not to say
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={isEdit ? updateForm.control : createForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main St, City, State 12345"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Contact Information */}
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={isEdit ? updateForm.control : createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={isEdit ? updateForm.control : createForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Include country code (e.g., +1 for US)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Emergency Contact</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={isEdit ? updateForm.control : createForm.control}
                      name="emergency_contact.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={isEdit ? updateForm.control : createForm.control}
                      name="emergency_contact.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1987654321" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={isEdit ? updateForm.control : createForm.control}
                    name="emergency_contact.relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Spouse, Parent, Sibling, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Medical Information */}
              <TabsContent value="medical" className="space-y-4">
                <FormField
                  control={isEdit ? updateForm.control : createForm.control}
                  name="primary_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Condition</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Lower back pain, ACL tear, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={isEdit ? updateForm.control : createForm.control}
                    name="injury_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Injury Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={isEdit ? updateForm.control : createForm.control}
                    name="referral_source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Source</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Dr. Smith, Self-referred, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Insurance Information</h4>

                  <FormField
                    control={isEdit ? updateForm.control : createForm.control}
                    name="insurance_info.provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Provider</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Blue Cross Blue Shield, Aetna, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={isEdit ? updateForm.control : createForm.control}
                      name="insurance_info.policy_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Policy #" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={isEdit ? updateForm.control : createForm.control}
                      name="insurance_info.group_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Group #" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={isEdit ? updateForm.control : createForm.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment Goals</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Return to running, reduce pain, improve mobility..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Settings */}
              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">
                    Communication Preferences
                  </h4>

                  <div className="space-y-3">
                    <FormField
                      control={isEdit ? updateForm.control : createForm.control}
                      name="opt_in_sms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>SMS Notifications</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Receive appointment reminders and exercise prompts
                              via SMS
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={isEdit ? updateForm.control : createForm.control}
                      name="opt_in_email"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Email Notifications</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Receive appointment confirmations and updates via
                              email
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? isEdit
                    ? "Updating..."
                    : "Creating..."
                  : isEdit
                    ? "Update Patient"
                    : "Create Patient"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
