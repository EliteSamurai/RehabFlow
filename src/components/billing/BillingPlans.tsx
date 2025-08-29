"use client";

import { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { BILLING_PLANS, type BillingPlan } from "@/lib/billing/stripe";
import { createCheckoutSession } from "@/lib/billing/actions";

export function BillingPlans() {
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>("growth");
  const [loading, setLoading] = useState(false);

  const handlePlanSelect = async () => {
    setLoading(true);
    try {
      const result = await createCheckoutSession(selectedPlan, "clinic-id", 14);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600">
          Select the plan that best fits your clinic&apos;s needs
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(BILLING_PLANS).map(([key, plan]) => (
            <div
              key={key}
              className={`relative border rounded-lg p-6 cursor-pointer transition-all ${
                selectedPlan === key
                  ? "border-blue-500 ring-2 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedPlan(key as BillingPlan)}
            >
              {selectedPlan === key && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                  <CheckIcon className="h-4 w-4" />
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {plan.name}
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    {plan.smsIncluded.toLocaleString()} SMS included
                  </p>
                  <p className="text-sm text-gray-600">
                    Up to {plan.maxPatients} patients
                  </p>
                  <p className="text-sm text-gray-600">
                    Up to {plan.maxTherapists} therapists
                  </p>
                </div>

                <ul className="mt-6 space-y-2 text-sm text-gray-600">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handlePlanSelect}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Start Free Trial"}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            14-day free trial • No credit card required to start
          </p>
        </div>
      </div>
    </div>
  );
}
