import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { withServiceRole } from "@/server/supabase-service";
import { stripe } from "@/lib/billing/stripe-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event: Stripe.Event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log("Received webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any;
        const clinicId = session.metadata?.clinic_id;

        if (!clinicId) {
          console.error("No clinic_id in session metadata");
          break;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = session.subscription as any;

        if (!subscription) {
          console.error("No subscription in session");
          break;
        }

        await handleCheckoutCompleted(session, clinicId);
        break;
      }

      case "invoice.payment_succeeded": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) {
          console.error("No subscription ID in invoice");
          break;
        }

        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) {
          console.error("No subscription ID in invoice");
          break;
        }

        await handlePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
        const clinicId = subscription.metadata?.clinic_id;

        if (!clinicId) {
          console.error("No clinic_id in subscription metadata");
          break;
        }

        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
        const clinicId = subscription.metadata?.clinic_id;

        if (!clinicId) {
          console.error("No clinic_id in subscription metadata");
          break;
        }

        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Helper functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCheckoutCompleted(session: any, clinicId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = (await stripe.subscriptions.retrieve(
    session.subscription
  )) as any;

  await withServiceRole(async (supabase) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("clinic_subscriptions")
      .upsert({
        clinic_id: clinicId,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      });

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  }, "checkout-completed");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentSucceeded(invoice: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = (await stripe.subscriptions.retrieve(
    invoice.subscription
  )) as any;

  await withServiceRole(async (supabase) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("clinic_subscriptions")
      .update({
        status: subscription.status,
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  }, "payment-succeeded");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(invoice: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = (await stripe.subscriptions.retrieve(
    invoice.subscription
  )) as any;

  await withServiceRole(async (supabase) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("clinic_subscriptions")
      .update({
        status: subscription.status,
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  }, "payment-failed");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(subscription: any) {
  await withServiceRole(async (supabase) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("clinic_subscriptions")
      .update({
        status: subscription.status,
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  }, "subscription-updated");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionDeleted(subscription: any) {
  await withServiceRole(async (supabase) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("clinic_subscriptions")
      .update({
        status: "canceled",
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  }, "subscription-deleted");
}
