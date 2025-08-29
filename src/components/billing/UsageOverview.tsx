"use client";

import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  formatSMSCount,
  calculateUsagePercentage,
  getUsageStatusColor,
} from "@/lib/billing/utils";

interface UsageOverviewProps {
  usage: {
    smsUsage: {
      sent: number;
      included: number;
      overage: number;
      overageCost: number;
    };
    limits: {
      maxPatients: number;
      maxTherapists: number;
    };
  };
}

export function UsageOverview({ usage }: UsageOverviewProps) {
  const smsPercentage = calculateUsagePercentage(
    usage.smsUsage.sent,
    usage.smsUsage.included
  );
  const smsStatusColor = getUsageStatusColor(smsPercentage);

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Usage This Month</h2>
        <p className="text-gray-600">Track your SMS usage and plan limits</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SMS Usage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  SMS Messages
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatSMSCount(usage.smsUsage.sent)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Usage</span>
                <span>
                  {usage.smsUsage.sent} /{" "}
                  {formatSMSCount(usage.smsUsage.included)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${smsStatusColor}`}
                  style={{ width: `${Math.min(100, smsPercentage)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {smsPercentage.toFixed(1)}% of plan limit
              </p>
            </div>

            {usage.smsUsage.overage > 0 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  {formatSMSCount(usage.smsUsage.overage)} overage messages
                </p>
                <p className="text-xs text-yellow-800 font-medium">
                  +${usage.smsUsage.overageCost.toFixed(2)} this month
                </p>
              </div>
            )}
          </div>

          {/* Patient Limit */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Patient Limit
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {usage.limits.maxPatients.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Maximum patients allowed
            </p>
          </div>

          {/* Therapist Limit */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Therapist Limit
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {usage.limits.maxTherapists}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Maximum therapists allowed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
