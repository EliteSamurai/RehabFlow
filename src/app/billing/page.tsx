"use client";

import { useEffect, useState } from "react";
import { getClinicSubscription, getUsageData } from "@/lib/billing/actions";
import { BillingPlans } from "@/components/billing/BillingPlans";
import { UsageOverview } from "@/components/billing/UsageOverview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, TrendingUp, Users } from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  subscription_plans: {
    name: string;
    price_monthly: number;
    sms_included: number;
    max_patients: number;
    max_therapists: number;
  };
}

interface Usage {
  clinicId: string;
  currentPeriod: {
    start: string;
    end: string;
  };
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
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBillingData() {
      try {
        // For now, use a placeholder clinic ID - this should come from auth context
        const clinicId = "placeholder-clinic-id";

        const [subscriptionData, usageData] = await Promise.all([
          getClinicSubscription(clinicId),
          getUsageData(clinicId),
        ]);

        if (subscriptionData) {
          setSubscription(subscriptionData);
        }

        if (usageData) {
          setUsage(usageData);
        }
      } catch (error) {
        console.error("Error loading billing data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBillingData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Usage</h1>
          <p className="text-muted-foreground">
            Manage your subscription and monitor usage
          </p>
        </div>
        <Button>
          <CreditCard className="w-4 h-4 mr-2" />
          Manage Billing
        </Button>
      </div>

      {/* Current Plan Overview */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Current Plan: {subscription.subscription_plans.name}
            </CardTitle>
            <CardDescription>
              {subscription.status === "trialing"
                ? `Trial ends ${new Date(subscription.trial_end!).toLocaleDateString()}`
                : `Next billing: ${new Date(subscription.current_period_end).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${subscription.subscription_plans.price_monthly}
                </div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {subscription.subscription_plans.sms_included.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  SMS included
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {subscription.subscription_plans.max_patients}
                </div>
                <div className="text-sm text-muted-foreground">
                  max patients
                </div>
              </div>
            </div>
            {subscription.cancel_at_period_end && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Your subscription will be cancelled at the end of the current
                  billing period.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Overview */}
      {usage && <UsageOverview usage={usage} />}

      {/* Upgrade Plans */}
      <BillingPlans />
    </div>
  );
}
