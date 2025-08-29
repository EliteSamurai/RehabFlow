import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { env } from "@/env";
import { supabaseService } from "@/server/supabase-service";
import type { Stripe } from "stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await handleSubscriptionChange(
            event.data.object as Stripe.Subscription
          );
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionDeletion(
            event.data.object as Stripe.Subscription
          );
          break;

        case "invoice.payment_succeeded":
          await handlePaymentSuccess(event.data.object as Stripe.Invoice);
          break;

        case "invoice.payment_failed":
          await handlePaymentFailure(event.data.object as Stripe.Invoice);
          break;

        case "customer.subscription.trial_will_end":
          await handleTrialEnding(event.data.object as Stripe.Subscription);
          break;

        case "customer.subscription.trial_ended":
          await handleTrialEnded(event.data.object as Stripe.Subscription);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Handle subscription creation/updates
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const supabase = supabaseService();

  const { error } = await supabase.from("clinic_subscriptions").upsert({
    stripe_subscription_id: subscription.id,
    customer_id: subscription.customer as string,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date(),
  });

  if (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

// Handle subscription deletion
async function handleSubscriptionDeletion(subscription: Stripe.Subscription) {
  const supabase = supabaseService();

  const { error } = await supabase
    .from("clinic_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating deleted subscription:", error);
    throw error;
  }
}

// Handle successful payment
async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  const supabase = supabaseService();

  // Update subscription status if it was past_due
  if (invoice.subscription) {
    const { error } = await supabase
      .from("clinic_subscriptions")
      .update({
        status: "active",
        updated_at: new Date(),
      })
      .eq("stripe_subscription_id", invoice.subscription as string);

    if (error) {
      console.error("Error updating subscription status:", error);
      throw error;
    }
  }
}

// Handle payment failure
async function handlePaymentFailure(invoice: Stripe.Invoice) {
  const supabase = supabaseService();

  if (invoice.subscription) {
    const { error } = await supabase
      .from("clinic_subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date(),
      })
      .eq("stripe_subscription_id", invoice.subscription as string);

    if (error) {
      console.error("Error updating subscription status:", error);
      throw error;
    }
  }
}

// Handle trial ending soon
async function handleTrialEnding(subscription: Stripe.Subscription) {
  // Could send email notification to clinic owner
  console.log(`Trial ending soon for subscription: ${subscription.id}`);
}

// Handle trial ended
async function handleTrialEnded(subscription: Stripe.Subscription) {
  const supabase = supabaseService();

  const { error } = await supabase
    .from("clinic_subscriptions")
    .update({
      status: "incomplete",
      updated_at: new Date(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating trial ended subscription:", error);
    throw error;
  }
}
