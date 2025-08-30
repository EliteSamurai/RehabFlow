"use server";

import { stripe } from "./stripe";
import { supabaseServer } from "@/server/supabase";
import { BILLING_PLANS, type BillingPlan } from "./stripe";
import { env } from "@/env";

// Create Stripe Checkout session
export async function createCheckoutSession(
  planId: BillingPlan,
  clinicId: string,
  trialDays: number = 14
) {
  try {
    const user = await getUser();
    if (!user?.user_metadata?.clinic_id) {
      throw new Error("User not associated with a clinic");
    }

    const plan = BILLING_PLANS[planId];
    if (!plan) {
      throw new Error("Invalid plan selected");
    }

    // Create or get Stripe customer
    let customerId = await getStripeCustomerId(clinicId);

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          clinic_id: clinicId,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Store customer ID in database
      await updateClinicCustomerId(clinicId, customerId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${env.NEXT_PUBLIC_APP_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          clinic_id: clinicId,
          plan_id: planId,
        },
      },
      metadata: {
        clinic_id: clinicId,
        plan_id: planId,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new Error("Failed to create checkout session");
  }
}

// Create customer portal session
export async function createPortalSession(clinicId: string) {
  try {
    const user = await getUser();
    if (
      !user?.user_metadata?.clinic_id ||
      user.user_metadata?.clinic_id !== clinicId
    ) {
      throw new Error("Unauthorized");
    }

    const customerId = await getStripeCustomerId(clinicId);
    if (!customerId) {
      throw new Error("No subscription found");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return { url: session.url };
  } catch (error) {
    console.error("Error creating portal session:", error);
    throw new Error("Failed to create portal session");
  }
}

// Get clinic subscription
export async function getClinicSubscription(clinicId: string) {
  try {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("clinic_subscriptions")
      .select(
        `
        *,
        subscription_plans (*)
      `
      )
      .eq("clinic_id", clinicId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting clinic subscription:", error);
    return null;
  }
}

// Get usage data for current period
export async function getUsageData(clinicId: string) {
  try {
    const supabase = await supabaseServer();

    // Get current subscription
    const subscription = await getClinicSubscription(clinicId);
    if (!subscription) return null;

    // Get SMS usage for current period
    const { data: smsUsage, error } = await supabase
      .from("message_logs")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("status", "sent")
      .gte("sent_at", subscription.current_period_start)
      .lte("sent_at", subscription.current_period_end);

    if (error) throw error;

    const smsSent = smsUsage?.length || 0;
    const plan =
      BILLING_PLANS[subscription.subscription_plans?.name as BillingPlan];
    const overage = Math.max(0, smsSent - (plan?.smsIncluded || 0));
    const overageCost = overage * 0.05; // $0.05 per SMS

    return {
      clinicId,
      currentPeriod: {
        start: subscription.current_period_start,
        end: subscription.current_period_end,
      },
      smsUsage: {
        sent: smsSent,
        included: plan?.smsIncluded || 0,
        overage,
        overageCost,
      },
      limits: {
        maxPatients: plan?.maxPatients || 0,
        maxTherapists: plan?.maxTherapists || 0,
      },
    };
  } catch (error) {
    console.error("Error getting usage data:", error);
    return null;
  }
}

// Helper functions
async function getUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getStripeCustomerId(clinicId: string): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("clinic_subscriptions")
    .select("customer_id")
    .eq("clinic_id", clinicId)
    .single();

  return data?.customer_id || null;
}

async function updateClinicCustomerId(clinicId: string, customerId: string) {
  const supabase = await supabaseServer();
  await supabase.from("clinic_subscriptions").upsert({
    clinic_id: clinicId,
    customer_id: customerId,
    status: "incomplete",
  });
}
