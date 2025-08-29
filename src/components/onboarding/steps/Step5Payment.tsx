"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  paymentSetupSchema,
  type PaymentSetupData,
} from "@/lib/validations/onboarding";
import { Button } from "@/components/ui/button";

import { CreditCardIcon, CheckIcon } from "lucide-react";

interface Step5Props {
  data?: PaymentSetupData;
  onNext: (data: PaymentSetupData) => void;
  onBack: () => void;
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 199,
    smsIncluded: 1000,
    features: ["Up to 100 patients", "Basic templates", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 349,
    smsIncluded: 2500,
    features: [
      "Up to 500 patients",
      "Custom templates",
      "Phone support",
      "Analytics",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    smsIncluded: 5000,
    features: [
      "Unlimited patients",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
  },
];

export default function Step5Payment({ data, onNext, onBack }: Step5Props) {
  const [selectedPlan] = useState(data?.subscriptionTier || "growth");
  const [useTrial] = useState(data?.useTrial !== false);

  const {} = useForm<PaymentSetupData>({
    resolver: zodResolver(paymentSetupSchema),
    defaultValues: data,
  });

  const onSubmit = () => {
    // Mock payment method ID - in real app, this would come from Stripe
    const mockPaymentData: PaymentSetupData = {
      subscriptionTier: selectedPlan as "starter" | "growth" | "pro",
      stripePaymentMethodId: "pm_mock_payment_method",
      useTrial,
    };
    onNext(mockPaymentData);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <CreditCardIcon className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Choose Your Plan
            </h2>
            <p className="mt-2 text-gray-600">
              Select the plan that best fits your practice size and needs.
            </p>
          </div>
        </div>
      </div>

      {/* Trial Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <CheckIcon className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-medium text-green-900">
              14-Day Free Trial
            </h3>
            <p className="text-green-800">
              Try RehabFlow risk-free. No charges until your trial ends.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Selection */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-600 text-white px-3 py-1 text-sm font-medium rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {plan.smsIncluded.toLocaleString()} SMS included
              </p>
            </div>

            <ul className="mt-6 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {selectedPlan === plan.id && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mock Payment Form */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Payment Information
        </h4>
        <div className="bg-white border border-gray-300 rounded p-4">
          <p className="text-center text-gray-600">
            🔒 Secure payment form would appear here
            <br />
            <span className="text-sm">(Stripe integration for production)</span>
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit}>
          {useTrial ? "Start Free Trial" : "Subscribe Now"}
        </Button>
      </div>
    </div>
  );
}
