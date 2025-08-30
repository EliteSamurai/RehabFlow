"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

// Step components
import Step1BasicSignup from "./steps/Step1BasicSignup";
import Step2ClinicInfo from "./steps/Step2ClinicInfo";
import Step3UserSetup from "./steps/Step3UserSetup";
import Step4Compliance from "./steps/Step4Compliance";
import Step5Payment from "./steps/Step5Payment";
import Step6Configuration from "./steps/Step6Configuration";
import Step7SMSTest from "./steps/Step7SMSTest";
import Step8StaffInvites from "./steps/Step8StaffInvites";
import Step9GoLive from "./steps/Step9GoLive";

import type {
  BasicSignupData,
  ClinicInfoData,
  UserSetupData,
  ComplianceData,
  PaymentSetupData,
  ConfigurationData,
  StaffInvitationData,
} from "@/lib/validations/onboarding";

const steps = [
  { id: 1, title: "Account", description: "Basic information" },
  { id: 2, title: "Clinic", description: "Practice details" },
  { id: 3, title: "Profile", description: "Your information" },
  { id: 4, title: "Compliance", description: "HIPAA & consent" },
  { id: 5, title: "Payment", description: "Subscription setup" },
  { id: 6, title: "Configuration", description: "Initial setup" },
  { id: 7, title: "SMS Test", description: "Verify integration" },
  { id: 8, title: "Team", description: "Invite staff" },
  { id: 9, title: "Go Live", description: "Complete setup" },
];

export interface OnboardingData {
  step1?: BasicSignupData;
  step2?: ClinicInfoData;
  step3?: UserSetupData;
  step4?: ComplianceData;
  step5?: PaymentSetupData;
  step6?: ConfigurationData;
  step7?: { testCompleted: boolean };
  step8?: StaffInvitationData;
}

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle URL parameters for email confirmation and step continuation
  useEffect(() => {
    const emailConfirmed = searchParams.get("email_confirmed") === "true";
    const stepParam = searchParams.get("step");

    if (emailConfirmed && stepParam) {
      const step = parseInt(stepParam, 10);
      if (step >= 1 && step <= steps.length) {
        setCurrentStep(step);
        // Show success message for email confirmation
        if (typeof window !== "undefined") {
          setTimeout(() => {
            const event = new CustomEvent("show-toast", {
              detail: {
                type: "success",
                message: "Email confirmed! Please continue with your setup.",
              },
            });
            window.dispatchEvent(event);
          }, 500);
        }
      }
    }
  }, [searchParams]);

  const updateData = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // TODO: Submit complete onboarding data
      console.log("Complete onboarding data:", data);
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicSignup
            data={data.step1}
            onNext={(stepData) => {
              updateData({ step1: stepData });
              nextStep();
            }}
          />
        );
      case 2:
        return (
          <Step2ClinicInfo
            data={data.step2}
            onNext={(stepData: ClinicInfoData) => {
              updateData({ step2: stepData });
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <Step3UserSetup
            data={data.step3}
            onNext={(stepData: UserSetupData) => {
              updateData({ step3: stepData });
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <Step4Compliance
            data={data.step4}
            onNext={(stepData: ComplianceData) => {
              updateData({ step4: stepData });
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <Step5Payment
            data={data.step5}
            onNext={(stepData: PaymentSetupData) => {
              updateData({ step5: stepData });
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 6:
        return (
          <Step6Configuration
            data={data.step6}
            onNext={(stepData: ConfigurationData) => {
              updateData({ step6: stepData });
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 7:
        return (
          <Step7SMSTest
            clinicPhone={data.step2?.clinicPhone}
            onNext={(stepData: { testCompleted: boolean }) => {
              updateData({ step7: stepData });
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 8:
        return (
          <Step8StaffInvites
            data={data.step8}
            clinicName={data.step2?.clinicName}
            onNext={(stepData: StaffInvitationData) => {
              updateData({ step8: stepData });
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 9:
        return (
          <Step9GoLive
            data={data}
            onComplete={completeOnboarding}
            onBack={prevStep}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">RehabFlow</h1>
              <span className="ml-3 text-sm text-gray-500">Setup</span>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          {/* Mobile Progress */}
          <div className="block sm:hidden mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                Step {currentStep} of {steps.length}
              </span>
              <span>{Math.round((currentStep / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-medium text-gray-900">
                {steps[currentStep - 1]?.title}
              </span>
            </div>
          </div>

          {/* Desktop Progress */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between overflow-x-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.id < currentStep
                          ? "bg-indigo-600 text-white"
                          : step.id === currentStep
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step.id < currentStep ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="ml-2 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-2 flex-shrink-0 ${
                        step.id < currentStep ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">{renderStep()}</div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
