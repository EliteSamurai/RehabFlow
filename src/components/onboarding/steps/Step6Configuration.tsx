"use client";

import { Button } from "@/components/ui/button";
import type { ConfigurationData } from "@/lib/validations/onboarding";

interface Step6Props {
  data?: ConfigurationData;
  onNext: (data: ConfigurationData) => void;
  onBack: () => void;
}

export default function Step6Configuration({ onNext, onBack }: Step6Props) {
  const handleSubmit = () => {
    // Mock configuration data
    const mockConfig: ConfigurationData = {
      treatmentTypes: ["post-surgical", "sports-injury", "chronic-pain"],
      businessHours: {
        monday: { start: "09:00", end: "17:00", closed: false },
        tuesday: { start: "09:00", end: "17:00", closed: false },
        wednesday: { start: "09:00", end: "17:00", closed: false },
        thursday: { start: "09:00", end: "17:00", closed: false },
        friday: { start: "09:00", end: "17:00", closed: false },
        saturday: { start: "09:00", end: "13:00", closed: false },
        sunday: { start: "09:00", end: "17:00", closed: true },
      },
      importPatients: "skip",
    };
    onNext(mockConfig);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Initial Configuration</h2>
        <p className="mt-2 text-gray-600">Set up your basic practice preferences.</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-center text-gray-600">
          Configuration wizard would appear here
          <br />
          <span className="text-sm">(Treatment types, business hours, patient import)</span>
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit}>Continue</Button>
      </div>
    </div>
  );
}
