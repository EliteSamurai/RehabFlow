"use client";

import { useState } from "react";
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
import { PlusIcon, XIcon, UsersIcon } from "lucide-react";
import type { StaffInvitationData } from "@/lib/validations/onboarding";

interface Step8Props {
  data?: StaffInvitationData;
  clinicName?: string;
  onNext: (data: StaffInvitationData) => void;
  onBack: () => void;
}

interface StaffMember {
  email: string;
  firstName: string;
  lastName: string;
  role: "therapist" | "assistant";
}

export default function Step8StaffInvites({
  data,
  clinicName,
  onNext,
  onBack,
}: Step8Props) {
  const [invitations, setInvitations] = useState<StaffMember[]>(
    data?.invitations || []
  );

  const addInvitation = () => {
    setInvitations([
      ...invitations,
      { email: "", firstName: "", lastName: "", role: "therapist" },
    ]);
  };

  const removeInvitation = (index: number) => {
    setInvitations(invitations.filter((_, i) => i !== index));
  };

  const updateInvitation = (
    index: number,
    field: keyof StaffMember,
    value: string
  ) => {
    const updated = invitations.map((inv, i) =>
      i === index ? { ...inv, [field]: value } : inv
    );
    setInvitations(updated);
  };

  const handleContinue = () => {
    const validInvitations = invitations.filter(
      (inv) => inv.email && inv.firstName && inv.lastName
    );
    onNext({ invitations: validInvitations });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <UsersIcon className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Invite Your Team
            </h2>
            <p className="mt-2 text-gray-600">
              Invite therapists and assistants to join{" "}
              {clinicName || "your clinic"}.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          <strong>Optional:</strong> You can skip this step and invite team
          members later from your dashboard.
        </p>
      </div>

      <div className="space-y-4">
        {invitations.map((invitation, index) => (
          <div
            key={index}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium text-gray-900">
                Team Member {index + 1}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeInvitation(index)}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor={`firstName-${index}`}>First Name</Label>
                <Input
                  id={`firstName-${index}`}
                  value={invitation.firstName}
                  onChange={(e) =>
                    updateInvitation(index, "firstName", e.target.value)
                  }
                  placeholder="John"
                />
              </div>

              <div>
                <Label htmlFor={`lastName-${index}`}>Last Name</Label>
                <Input
                  id={`lastName-${index}`}
                  value={invitation.lastName}
                  onChange={(e) =>
                    updateInvitation(index, "lastName", e.target.value)
                  }
                  placeholder="Doe"
                />
              </div>

              <div>
                <Label htmlFor={`role-${index}`}>Role</Label>
                <Select
                  value={invitation.role}
                  onValueChange={(value) =>
                    updateInvitation(index, "role", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="therapist">Therapist</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor={`email-${index}`}>Email Address</Label>
              <Input
                id={`email-${index}`}
                type="email"
                value={invitation.email}
                onChange={(e) =>
                  updateInvitation(index, "email", e.target.value)
                }
                placeholder="john@clinic.com"
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addInvitation}
          className="w-full"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {invitations.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            {
              invitations.filter(
                (inv) => inv.email && inv.firstName && inv.lastName
              ).length
            }{" "}
            team member(s) will receive invitation emails after setup is
            complete.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          {invitations.length > 0 ? "Send Invitations" : "Skip for Now"}
        </Button>
      </div>
    </div>
  );
}
