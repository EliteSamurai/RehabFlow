"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSetupSchema, type UserSetupData } from "@/lib/validations/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserIcon } from "lucide-react";

interface Step3Props {
  data?: UserSetupData;
  onNext: (data: UserSetupData) => void;
  onBack: () => void;
}

export default function Step3UserSetup({ data, onNext, onBack }: Step3Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserSetupData>({
    resolver: zodResolver(userSetupSchema),
    defaultValues: data,
  });

  const onSubmit = (formData: UserSetupData) => {
    onNext(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <UserIcon className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Your Profile
            </h2>
            <p className="mt-2 text-gray-600">
              Set up your user profile as the clinic administrator.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Role:</strong> Clinic Administrator (Full access to all features)
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="credentials">Professional Credentials</Label>
          <Input
            {...register("credentials")}
            type="text"
            className={errors.credentials ? "border-red-300" : ""}
            placeholder="PT, DPT, OTR, etc."
          />
          <p className="mt-1 text-sm text-gray-500">
            Your professional credentials (e.g., PT, DPT, OTR, PTA)
          </p>
          {errors.credentials && (
            <p className="mt-1 text-sm text-red-600">{errors.credentials.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Your Phone Number</Label>
          <Input
            {...register("phone")}
            type="tel"
            className={errors.phone ? "border-red-300" : ""}
            placeholder="+1234567890"
          />
          <p className="mt-1 text-sm text-gray-500">
            Used for MFA and HIPAA compliance notifications. Include country code.
          </p>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
