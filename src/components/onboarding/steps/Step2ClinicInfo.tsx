"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  clinicInfoSchema,
  type ClinicInfoData,
} from "@/lib/validations/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Step2Props {
  data?: ClinicInfoData;
  onNext: (data: ClinicInfoData) => void;
  onBack: () => void;
}

const specialties = [
  { value: "orthopedic", label: "Orthopedic" },
  { value: "sports", label: "Sports Medicine" },
  { value: "neurological", label: "Neurological" },
  { value: "pediatric", label: "Pediatric" },
  { value: "geriatric", label: "Geriatric" },
  { value: "cardiopulmonary", label: "Cardiopulmonary" },
  { value: "other", label: "Other" },
];

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
];

export default function Step2ClinicInfo({ data, onNext, onBack }: Step2Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClinicInfoData>({
    resolver: zodResolver(clinicInfoSchema),
    defaultValues: data,
  });

  const watchedTimezone = watch("timezone");

  const onSubmit = (formData: ClinicInfoData) => {
    onNext(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Tell us about your clinic
        </h2>
        <p className="mt-2 text-gray-600">
          This information helps us customize RehabFlow for your practice.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="clinicName">Clinic Name</Label>
          <Input
            {...register("clinicName")}
            type="text"
            className={errors.clinicName ? "border-red-300" : ""}
            placeholder="Your Rehabilitation Center"
          />
          {errors.clinicName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.clinicName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="clinicPhone">Clinic Phone Number</Label>
          <Input
            {...register("clinicPhone")}
            type="tel"
            className={errors.clinicPhone ? "border-red-300" : ""}
            placeholder="+1234567890"
          />
          <p className="mt-1 text-sm text-gray-500">
            Include country code (e.g., +1 for US). This will be used as your
            SMS sender ID.
          </p>
          {errors.clinicPhone && (
            <p className="mt-1 text-sm text-red-600">
              {errors.clinicPhone.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="address">Clinic Address</Label>
          <Input
            {...register("address")}
            type="text"
            className={errors.address ? "border-red-300" : ""}
            placeholder="123 Main St, City, State 12345"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="specialty">Clinic Specialty</Label>
            <Select
              value={watch("specialty")}
              onValueChange={(value: "other" | "orthopedic" | "sports" | "neurological" | "pediatric" | "geriatric" | "cardiopulmonary") => setValue("specialty", value)}
            >
              <SelectTrigger
                className={errors.specialty ? "border-red-300" : ""}
              >
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty.value} value={specialty.value}>
                    {specialty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.specialty && (
              <p className="mt-1 text-sm text-red-600">
                {errors.specialty.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={watchedTimezone}
              onValueChange={(value) => setValue("timezone", value)}
            >
              <SelectTrigger
                className={errors.timezone ? "border-red-300" : ""}
              >
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((timezone) => (
                  <SelectItem key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timezone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.timezone.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </div>
  );
}
