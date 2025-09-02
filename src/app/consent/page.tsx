"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Activity,
  Users,
  Calendar,
  Shield,
  FileText,
  MessageSquare,
  Lock,
} from "lucide-react";
import Link from "next/link";

interface ConsentFormData {
  smsConsent: boolean;
  emailConsent: boolean;
  dataProcessing: boolean;
  thirdPartySharing: boolean;
  marketingCommunications: boolean;
  ageConfirmation: boolean;
  termsAcceptance: boolean;
}

export default function ConsentPage() {
  const [consentData, setConsentData] = useState<ConsentFormData>({
    smsConsent: false,
    emailConsent: false,
    dataProcessing: false,
    thirdPartySharing: false,
    marketingCommunications: false,
    ageConfirmation: false,
    termsAcceptance: false,
  });

  const [showFullTerms, setShowFullTerms] = useState(false);

  const handleConsentChange = (
    field: keyof ConsentFormData,
    value: boolean
  ) => {
    setConsentData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // In a real implementation, this would save to the database
    console.log("Consent data submitted:", consentData);
    // Redirect to dashboard or next step
  };

  const allConsentsGiven = Object.values(consentData).every(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              Patient Consent & Privacy
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your privacy and data security are our top priorities. This consent
            form explains how we collect, use, and protect your information in
            accordance with HIPAA, GDPR, and other privacy regulations.
          </p>
        </div>

        {/* Main Consent Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <FileText className="h-6 w-6 mr-2" />
              Communication & Data Consent
            </CardTitle>
            <CardDescription>
              Please review and select your communication preferences and data
              handling consent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SMS Communications */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="smsConsent"
                  checked={consentData.smsConsent}
                  onCheckedChange={(checked) =>
                    handleConsentChange("smsConsent", checked as boolean)
                  }
                />
                <div className="space-y-2">
                  <Label
                    htmlFor="smsConsent"
                    className="text-base font-semibold flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                    SMS Communications (TCPA Compliant)
                  </Label>
                  <p className="text-sm text-gray-600">
                    I consent to receive SMS messages for appointment reminders,
                    exercise prompts, progress check-ins, and treatment-related
                    communications. Message frequency varies based on your
                    treatment plan. Reply STOP to opt-out at any time. Standard
                    message and data rates may apply.
                  </p>
                  <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
                    <strong>What you&apos;ll receive:</strong> Appointment
                    reminders (24h, 4h, 1h before), home exercise reminders,
                    progress check-ins, no-show recovery messages, and treatment
                    updates.
                  </div>
                </div>
              </div>
            </div>

            {/* Email Communications */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="emailConsent"
                  checked={consentData.emailConsent}
                  onCheckedChange={(checked) =>
                    handleConsentChange("emailConsent", checked as boolean)
                  }
                />
                <div className="space-y-2">
                  <Label
                    htmlFor="emailConsent"
                    className="text-base font-semibold flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-2 text-green-600" />
                    Email Communications
                  </Label>
                  <p className="text-sm text-gray-600">
                    I consent to receive email communications including
                    appointment confirmations, treatment summaries, progress
                    reports, and clinic updates.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Data Processing Consent */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="dataProcessing"
                  checked={consentData.dataProcessing}
                  onCheckedChange={(checked) =>
                    handleConsentChange("dataProcessing", checked as boolean)
                  }
                />
                <div className="space-y-2">
                  <Label
                    htmlFor="dataProcessing"
                    className="text-base font-semibold flex items-center"
                  >
                    <Activity className="h-4 w-4 mr-2 text-purple-600" />
                    Data Processing Consent (GDPR Article 6)
                  </Label>
                  <p className="text-sm text-gray-600">
                    I consent to the processing of my personal data for the
                    purposes of providing physical therapy services, tracking
                    treatment progress, and improving care quality. This
                    includes health information, contact details, and treatment
                    outcomes.
                  </p>
                </div>
              </div>
            </div>

            {/* Third Party Sharing */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="thirdPartySharing"
                  checked={consentData.thirdPartySharing}
                  onCheckedChange={(checked) =>
                    handleConsentChange("thirdPartySharing", checked as boolean)
                  }
                />
                <div className="space-y-2">
                  <Label
                    htmlFor="thirdPartySharing"
                    className="text-base font-semibold flex items-center"
                  >
                    <Users className="h-4 w-4 mr-2 text-orange-600" />
                    Third-Party Service Providers
                  </Label>
                  <p className="text-sm text-gray-600">
                    I consent to the sharing of my information with trusted
                    third-party service providers (Twilio for SMS, Stripe for
                    payments, Supabase for data storage) who assist in
                    delivering our services. All providers maintain HIPAA
                    compliance and data security standards.
                  </p>
                </div>
              </div>
            </div>

            {/* Marketing Communications */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketingCommunications"
                  checked={consentData.marketingCommunications}
                  onCheckedChange={(checked) =>
                    handleConsentChange(
                      "marketingCommunications",
                      checked as boolean
                    )
                  }
                />
                <div className="space-y-2">
                  <Label
                    htmlFor="marketingCommunications"
                    className="text-base font-semibold flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-red-600" />
                    Marketing & Educational Communications
                  </Label>
                  <p className="text-sm text-gray-600">
                    I consent to receive educational content, wellness tips, and
                    promotional offers related to physical therapy and
                    rehabilitation services. These communications are separate
                    from treatment-related messages and can be opted out of
                    independently.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Age Confirmation */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="ageConfirmation"
                  checked={consentData.ageConfirmation}
                  onCheckedChange={(checked) =>
                    handleConsentChange("ageConfirmation", checked as boolean)
                  }
                />
                <div className="space-y-2">
                  <Label
                    htmlFor="ageConfirmation"
                    className="text-base font-semibold"
                  >
                    Age Confirmation
                  </Label>
                  <p className="text-sm text-gray-600">
                    I confirm that I am at least 18 years old, or if under 18, I
                    have parental/guardian consent to provide this information
                    and receive communications.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms Acceptance */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="termsAcceptance"
                  checked={consentData.termsAcceptance}
                  onCheckedChange={(checked) =>
                    handleConsentChange("termsAcceptance", checked as boolean)
                  }
                />
                <div className="space-y-2">
                  <Label
                    htmlFor="termsAcceptance"
                    className="text-base font-semibold"
                  >
                    Terms & Conditions Acceptance
                  </Label>
                  <p className="text-sm text-gray-600">
                    I have read, understood, and agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowFullTerms(!showFullTerms)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms of Service (Expandable) */}
        {showFullTerms && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Terms of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div className="space-y-3">
                <h4 className="font-semibold">1. Service Description</h4>
                <p>
                  RehabFlow provides patient communication services for physical
                  therapy clinics, including SMS reminders, exercise tracking,
                  and progress monitoring.
                </p>

                <h4 className="font-semibold">2. HIPAA Compliance</h4>
                <p>
                  We maintain HIPAA compliance through Business Associate
                  Agreements with all service providers and implement
                  appropriate technical and administrative safeguards.
                </p>

                <h4 className="font-semibold">3. Data Security</h4>
                <p>
                  All data is encrypted in transit and at rest. We use
                  industry-standard security practices and regular security
                  audits.
                </p>

                <h4 className="font-semibold">4. Consent Withdrawal</h4>
                <p>
                  You may withdraw consent at any time by contacting your clinic
                  or using the opt-out mechanisms provided in our
                  communications.
                </p>

                <h4 className="font-semibold">5. Data Retention</h4>
                <p>
                  We retain your data for as long as necessary to provide
                  services and comply with legal obligations, typically 7 years
                  for medical records.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy & Security Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Lock className="h-5 w-5 mr-2" />
              Your Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-600">
                  HIPAA Compliance
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Business Associate Agreements with all vendors</li>
                  <li>• Encrypted data transmission and storage</li>
                  <li>• Access controls and audit logging</li>
                  <li>• Regular security assessments</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-green-600">GDPR Rights</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Right to access your data</li>
                  <li>• Right to rectification</li>
                  <li>• Right to erasure</li>
                  <li>• Right to data portability</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="text-center">
          <Button
            onClick={handleSubmit}
            disabled={!allConsentsGiven}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            {allConsentsGiven
              ? "Submit Consent"
              : "Please Complete All Consents"}
          </Button>
          {!allConsentsGiven && (
            <p className="text-sm text-gray-500 mt-2">
              All consent options must be selected to proceed
            </p>
          )}
        </div>

        {/* Footer Information */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Questions about this consent form? Contact your clinic or email{" "}
            <a
              href="mailto:privacy@rehabflow.com"
              className="text-blue-600 hover:underline"
            >
              privacy@rehabflow.com
            </a>
          </p>
          <p className="mt-1">
            This consent is valid until withdrawn. You may update your
            preferences at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
