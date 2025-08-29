"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { complianceSchema, type ComplianceData } from "@/lib/validations/onboarding";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheckIcon, AlertTriangleIcon } from "lucide-react";

interface Step4Props {
  data?: ComplianceData;
  onNext: (data: ComplianceData) => void;
  onBack: () => void;
}

export default function Step4Compliance({ data, onNext, onBack }: Step4Props) {
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ComplianceData>({
    resolver: zodResolver(complianceSchema),
    defaultValues: data,
  });

  const watchedPatientConsent = watch("patientConsentConfirm");
  const watchedHipaaGdpr = watch("hipaaGdprAgreement");

  const onSubmit = (formData: ComplianceData) => {
    onNext(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Compliance & Consent
            </h2>
            <p className="mt-2 text-gray-600">
              Ensure HIPAA and TCPA compliance for patient communications.
            </p>
          </div>
        </div>
      </div>

      {/* HIPAA/TCPA Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangleIcon className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-blue-900">
              Important: Patient Consent Required
            </h3>
            <p className="mt-2 text-blue-800">
              Before sending SMS messages to patients, you must obtain explicit consent. 
              RehabFlow helps you manage compliance, but you are responsible for collecting 
              and documenting patient consent according to HIPAA and TCPA regulations.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Patient Consent Confirmation */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="patientConsent"
              checked={watchedPatientConsent}
              onCheckedChange={(checked) => 
                setValue("patientConsentConfirm", checked as boolean)
              }
              className={errors.patientConsentConfirm ? "border-red-300" : ""}
            />
            <div className="space-y-1">
              <Label 
                htmlFor="patientConsent" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Patient SMS Consent Collection
              </Label>
              <p className="text-sm text-gray-600">
                I confirm that my clinic will collect and store explicit patient consent 
                before sending SMS messages, and maintain records of this consent as 
                required by TCPA regulations.
              </p>
            </div>
          </div>
          {errors.patientConsentConfirm && (
            <p className="text-sm text-red-600">{errors.patientConsentConfirm.message}</p>
          )}
        </div>

        {/* HIPAA/GDPR Agreement */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="hipaaGdpr"
              checked={watchedHipaaGdpr}
              onCheckedChange={(checked) => 
                setValue("hipaaGdprAgreement", checked as boolean)
              }
              className={errors.hipaaGdprAgreement ? "border-red-300" : ""}
            />
            <div className="space-y-1">
              <Label 
                htmlFor="hipaaGdpr" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                HIPAA & GDPR Compliance Agreement
              </Label>
              <p className="text-sm text-gray-600">
                I agree to comply with HIPAA, GDPR, and other applicable data protection 
                regulations when using RehabFlow. I understand that my clinic is responsible 
                for ensuring all patient communications meet regulatory requirements.
              </p>
            </div>
          </div>
          {errors.hipaaGdprAgreement && (
            <p className="text-sm text-red-600">{errors.hipaaGdprAgreement.message}</p>
          )}
        </div>

        {/* BAA Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Business Associate Agreement (BAA)
          </h4>
          <p className="text-gray-600 mb-4">
            RehabFlow will provide a Business Associate Agreement for HIPAA compliance. 
            This will be available for download after account setup is complete.
          </p>
          <div className="text-sm text-gray-500">
            <p>✓ HIPAA-compliant data handling</p>
            <p>✓ Encrypted data transmission</p>
            <p>✓ Secure data storage</p>
            <p>✓ Audit logging</p>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            type="submit" 
            disabled={!watchedPatientConsent || !watchedHipaaGdpr}
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
