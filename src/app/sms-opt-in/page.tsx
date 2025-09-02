import Link from "next/link";
import {
  MessageSquare,
  Shield,
  CheckCircle,
  Phone,
  Clock,
  Users,
  Building,
  Mail,
} from "lucide-react";

export default function SMSOptInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">RehabFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <MessageSquare className="h-16 w-16 text-indigo-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              SMS Communication Consent
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            RehabFlow provides HIPAA-compliant SMS communication services for
            physical therapy and rehabilitation clinics to improve patient
            outcomes and reduce no-shows.
          </p>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Building className="h-6 w-6 mr-2 text-indigo-600" />
            Business Information
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Company Name</h3>
                <p className="text-gray-600">RehabFlow, Inc.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Business Type</h3>
                <p className="text-gray-600">
                  Healthcare Technology / SaaS Platform
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Industry</h3>
                <p className="text-gray-600">
                  Physical Therapy & Rehabilitation Services
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Website</h3>
                <p className="text-gray-600">
                  https://rehabflow-one.vercel.app
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Contact Information
                </h3>
                <div className="flex items-center text-gray-600 mt-1">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>support@rehabflow.com</span>
                </div>
                <div className="flex items-center text-gray-600 mt-1">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+1 (888) 348-8352</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Service Area</h3>
                <p className="text-gray-600">United States</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Compliance</h3>
                <p className="text-gray-600">HIPAA, TCPA, GDPR Compliant</p>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Opt-In Information */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-green-600" />
            SMS Communication Program
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What We Do
              </h3>
              <p className="text-gray-600 mb-4">
                RehabFlow sends automated SMS messages on behalf of physical
                therapy clinics to:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Send appointment reminders (24 hours, 4 hours, and 1 hour
                  before appointments)
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Provide home exercise reminders and compliance tracking
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Send progress check-ins and motivation messages
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Handle no-show recovery and rescheduling assistance
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Deliver treatment-specific educational content
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How Patients Opt-In
              </h3>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-gray-700 mb-3">
                  <strong>
                    Patients provide explicit consent through multiple
                    touchpoints:
                  </strong>
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>• During clinic registration and intake forms</li>
                  <li>• Through our comprehensive consent management portal</li>
                  <li>• Via clinic staff during appointment scheduling</li>
                  <li>• Through our secure patient onboarding process</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Message Frequency & Opt-Out
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="space-y-2 text-gray-600">
                  <li>
                    • <strong>Frequency:</strong> Varies based on treatment plan
                    (typically 2-5 messages per week)
                  </li>
                  <li>
                    • <strong>Opt-Out:</strong> Reply STOP to any message to
                    unsubscribe immediately
                  </li>
                  <li>
                    • <strong>Help:</strong> Reply HELP for assistance and
                    contact information
                  </li>
                  <li>
                    • <strong>Rates:</strong> Standard message and data rates
                    may apply
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance & Security */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            Compliance & Security
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                HIPAA Compliance
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Business Associate Agreements with all vendors</li>
                <li>• End-to-end encryption for all communications</li>
                <li>• Secure data storage and transmission protocols</li>
                <li>• Regular security audits and compliance reviews</li>
                <li>• Access controls and audit logging</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                TCPA Compliance
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Explicit written consent before any SMS communication</li>
                <li>• Clear opt-out instructions in every message</li>
                <li>• Immediate processing of STOP requests</li>
                <li>• Consent timestamps and audit trails</li>
                <li>• Regular compliance training for clinic staff</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sample Messages */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-purple-600" />
            Sample Messages
          </h2>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-400">
              <p className="text-gray-700">
                <strong>Appointment Reminder:</strong>
                <br />
                &ldquo;Hi John, this is a reminder about your physical therapy
                appointment tomorrow at 2:00 PM with Dr. Smith at RehabFlow PT.
                Please reply CONFIRM or call (555) 123-4567 if you need to
                reschedule. Reply STOP to opt out.&rdquo;
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-md border-l-4 border-green-400">
              <p className="text-gray-700">
                <strong>Exercise Reminder:</strong>
                <br />
                &ldquo;Time for your daily exercises! Remember to do your knee
                strengthening routine (3 sets of 15). Track your progress in the
                app. Questions? Call your clinic. Reply STOP to opt out.&rdquo;
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
              <p className="text-gray-700">
                <strong>Progress Check-in:</strong>
                <br />
                &ldquo;How are you feeling after this week&apos;s therapy
                sessions? Rate your pain level 1-10 and reply with your number.
                Your progress matters to us! Reply STOP to opt out.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Support */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Users className="h-6 w-6 mr-2 text-indigo-600" />
            Contact & Support
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                For Patients
              </h3>
              <p className="text-gray-600 mb-4">
                If you have questions about SMS communications from your
                physical therapy clinic:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• Contact your clinic directly</li>
                <li>• Reply HELP to any SMS for assistance</li>
                <li>
                  • Email:{" "}
                  <a
                    href="mailto:support@rehabflow.com"
                    className="text-indigo-600 hover:underline"
                  >
                    support@rehabflow.com
                  </a>
                </li>
                <li>
                  • Phone:{" "}
                  <a
                    href="tel:+18883488352"
                    className="text-indigo-600 hover:underline"
                  >
                    +1 (888) 348-8352
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                For Clinics
              </h3>
              <p className="text-gray-600 mb-4">
                Physical therapy clinics interested in our services:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>
                  • Schedule a demo:{" "}
                  <Link
                    href="/signup"
                    className="text-indigo-600 hover:underline"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  • Sales inquiries:{" "}
                  <a
                    href="mailto:sales@rehabflow.com"
                    className="text-indigo-600 hover:underline"
                  >
                    sales@rehabflow.com
                  </a>
                </li>
                <li>
                  • Technical support:{" "}
                  <a
                    href="mailto:support@rehabflow.com"
                    className="text-indigo-600 hover:underline"
                  >
                    support@rehabflow.com
                  </a>
                </li>
                <li>
                  • Phone:{" "}
                  <a
                    href="tel:+18883488352"
                    className="text-indigo-600 hover:underline"
                  >
                    +1 (888) 348-8352
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-12 text-sm text-gray-500 space-x-6">
          <Link href="/consent" className="hover:text-gray-700 underline">
            Full Consent Form
          </Link>
          <Link href="/privacy" className="hover:text-gray-700 underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-gray-700 underline">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
