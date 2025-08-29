"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, MessageSquareIcon } from "lucide-react";

interface Step7Props {
  clinicPhone?: string;
  onNext: (data: { testCompleted: boolean }) => void;
  onBack: () => void;
}

export default function Step7SMSTest({
  clinicPhone,
  onNext,
  onBack,
}: Step7Props) {
  const [testSent, setTestSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendTestSMS = async () => {
    setIsLoading(true);
    // Mock SMS test
    setTimeout(() => {
      setTestSent(true);
      setIsLoading(false);
    }, 2000);
  };

  const handleContinue = () => {
    onNext({ testCompleted: testSent });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <MessageSquareIcon className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Test SMS Integration
            </h2>
            <p className="mt-2 text-gray-600">
              Verify that SMS delivery is working correctly.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800">
            We&apos;ll send a test message to:{" "}
            <strong>{clinicPhone || "Your phone"}</strong>
          </p>
        </div>

        {!testSent ? (
          <Button onClick={sendTestSMS} disabled={isLoading} className="px-8">
            {isLoading ? "Sending..." : "Send Test SMS"}
          </Button>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-3">
              <CheckIcon className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-medium text-green-900">
                  SMS Test Successful! 🚀
                </h3>
                <p className="text-green-800">
                  You should receive a welcome message shortly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!testSent}>
          Continue
        </Button>
      </div>
    </div>
  );
}
