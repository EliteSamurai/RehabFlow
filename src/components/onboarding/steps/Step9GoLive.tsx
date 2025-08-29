"use client";

import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon, RocketIcon } from "lucide-react";
import type { OnboardingData } from "../OnboardingWizard";

interface Step9Props {
  data: OnboardingData;
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export default function Step9GoLive({
  data,
  onComplete,
  onBack,
  isLoading,
}: Step9Props) {
  const checklistItems = [
    {
      id: "clinic-setup",
      title: "Clinic setup",
      completed: !!data.step2?.clinicName,
      description: data.step2?.clinicName
        ? `${data.step2.clinicName} configured`
        : "Clinic information needed",
    },
    {
      id: "compliance",
      title: "Compliance configured",
      completed:
        !!data.step4?.patientConsentConfirm && !!data.step4?.hipaaGdprAgreement,
      description: data.step4?.patientConsentConfirm
        ? "HIPAA & TCPA compliance confirmed"
        : "Compliance setup needed",
    },
    {
      id: "payment",
      title: "Payment configured",
      completed: !!data.step5?.stripePaymentMethodId,
      description: data.step5?.subscriptionTier
        ? `${data.step5.subscriptionTier} plan selected`
        : "Payment setup needed",
    },
    {
      id: "sms-test",
      title: "SMS integration tested",
      completed: !!data.step7?.testCompleted,
      description: data.step7?.testCompleted
        ? "SMS delivery verified"
        : "SMS test needed",
    },
    {
      id: "staff-invited",
      title: "Staff invited",
      completed: (data.step8?.invitations?.length || 0) > 0,
      description: data.step8?.invitations?.length
        ? `${data.step8.invitations.length} staff member(s) invited`
        : "Staff invitations pending",
    },
  ];

  const completedItems = checklistItems.filter((item) => item.completed).length;
  const totalItems = checklistItems.length;
  const allRequired = checklistItems
    .slice(0, 4)
    .every((item) => item.completed); // First 4 are required

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <RocketIcon className="w-10 h-10 text-indigo-600" />
          <h2 className="text-3xl font-bold text-gray-900">
            Ready to Go Live!
          </h2>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Congratulations! You&apos;ve completed the RehabFlow setup. Review
          your configuration and launch your patient communication platform.
        </p>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Setup Progress</h3>
          <span className="text-sm text-gray-600">
            {completedItems} of {totalItems} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedItems / totalItems) * 100}%` }}
          />
        </div>
      </div>

      {/* Onboarding Checklist */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Onboarding Checklist
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    item.completed
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {item.completed ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <XIcon className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div
                    className={`font-medium ${
                      item.completed ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinic Summary */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-indigo-900 mb-3">
          Your RehabFlow Setup
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-indigo-800">Clinic:</span>{" "}
            <span className="text-indigo-700">
              {data.step2?.clinicName || "Not set"}
            </span>
          </div>
          <div>
            <span className="font-medium text-indigo-800">Specialty:</span>{" "}
            <span className="text-indigo-700 capitalize">
              {data.step2?.specialty?.replace("_", " ") || "Not set"}
            </span>
          </div>
          <div>
            <span className="font-medium text-indigo-800">Plan:</span>{" "}
            <span className="text-indigo-700 capitalize">
              {data.step5?.subscriptionTier || "Not selected"}
              {data.step5?.useTrial && " (14-day trial)"}
            </span>
          </div>
          <div>
            <span className="font-medium text-indigo-800">Team:</span>{" "}
            <span className="text-indigo-700">
              1 admin + {data.step8?.invitations?.length || 0} invited
            </span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      {allRequired && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-green-900 mb-2">
            🎉 You&apos;re all set!
          </h4>
          <p className="text-green-800">
            Your RehabFlow account is configured and ready to start improving
            patient communication. You can begin adding patients and scheduling
            your first appointment reminders right away.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={!allRequired || isLoading}
          className="px-8"
        >
          {isLoading ? "Launching..." : "Launch RehabFlow"}
        </Button>
      </div>
    </div>
  );
}
