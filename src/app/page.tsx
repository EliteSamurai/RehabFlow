import Link from "next/link";

export default function LandingPage() {
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Patient Communication
            <span className="text-indigo-600"> for PT Clinics</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600">
            Specialized SMS automation platform for rehabilitation clinics.
            Reduce no-shows by 40-60%, improve treatment compliance, and enhance
            patient outcomes with therapy-specific messaging.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md text-lg font-medium transition-colors"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Physical Therapy Clinics Choose RehabFlow
          </h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-md flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Increase Revenue
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Reduce no-shows from 25% to 15% with automated appointment
                    reminders. For a clinic seeing 100 patients/week,
                    that&apos;s an extra $2,500 in monthly revenue.
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Automated 24hr and 2hr appointment reminders</li>
                    <li>
                      • SMS confirmations reduce last-minute cancellations
                    </li>
                    <li>• Waitlist management for cancelled slots</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-md flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Save Time
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Eliminate 15+ hours per week of manual phone calls and admin
                    work. Your staff can focus on patient care instead of
                    chasing appointments.
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• No more calling patients for reminders</li>
                    <li>• Automated follow-up sequences</li>
                    <li>• Bulk messaging for cancellations/updates</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-md flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Improve Treatment Compliance
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Achieve 70%+ exercise completion rates with therapy-specific
                    messaging. Track progress and keep patients engaged
                    throughout their recovery journey.
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Home exercise program reminders</li>
                    <li>• Progress milestone celebrations</li>
                    <li>
                      • Treatment-specific messaging for different conditions
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-md flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Get Insights
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Track patient engagement, identify at-risk patients, and
                    optimize your communication strategy with detailed
                    analytics.
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Response rate and engagement metrics</li>
                    <li>• Patient satisfaction tracking</li>
                    <li>• ROI reporting and optimization tips</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Built for Physical Therapy Clinics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-indigo-600 font-semibold text-lg mb-2">
                40-60%
              </div>
              <p className="text-gray-600">
                No-show reduction for PT clinics using intelligent SMS
                automation
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-green-600 font-semibold text-lg mb-2">
                70%+
              </div>
              <p className="text-gray-600">
                Exercise completion rate with therapy-specific messaging
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-blue-600 font-semibold text-lg mb-2">
                HIPAA
              </div>
              <p className="text-gray-600">
                Compliant platform designed specifically for healthcare
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
