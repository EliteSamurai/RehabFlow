"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCardIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { UsageOverview } from "@/components/billing/UsageOverview";
import { getClinicSubscription, getUsageData } from "@/lib/billing/actions";

export default function BillingPage() {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      // Get user's clinic ID from auth context
      const clinicId = "user-clinic-id"; // Replace with actual auth logic

      const [subData, usageData] = await Promise.all([
        getClinicSubscription(clinicId),
        getUsageData(clinicId),
      ]);

      setSubscription(subData);
      setUsage(usageData);
    } catch (error) {
      console.error("Error loading billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Billing & Subscription
        </h1>
        <p className="text-gray-600">
          Manage your plan, view usage, and handle billing
        </p>
      </div>

      {/* Current Plan Overview */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Current Plan</h2>
        </div>
        <div className="p-6">
          {subscription ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {subscription.subscription_plans?.name || "Unknown Plan"}
                </h3>
                <p className="text-gray-600">
                  {subscription.status === "trialing"
                    ? `Trial ends ${new Date(subscription.trial_end).toLocaleDateString()}`
                    : `Next billing: ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  ${subscription.subscription_plans?.price_monthly || 0}
                </p>
                <p className="text-gray-600">per month</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No active subscription</p>
              <button
                onClick={() => router.push("/billing/plans")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Choose a Plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Usage Overview */}
      {usage && <UsageOverview usage={usage} />}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <CreditCardIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                Payment Methods
              </h3>
              <p className="text-gray-600">Update your payment information</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
            Manage Payment Methods
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                Usage Analytics
              </h3>
              <p className="text-gray-600">Detailed usage breakdown</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
            View Analytics
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
              <p className="text-gray-600">Download and view invoices</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
            View Invoices
          </button>
        </div>
      </div>
    </div>
  );
}
