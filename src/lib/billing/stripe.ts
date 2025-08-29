import Stripe from 'stripe';
import { env } from '@/env';

// Initialize Stripe client
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Billing plans configuration
export const BILLING_PLANS = {
  starter: {
    id: 'price_starter_monthly',
    name: 'Starter',
    price: 199,
    smsIncluded: 1000,
    maxPatients: 100,
    maxTherapists: 3,
    features: [
      'Appointment reminders',
      'Basic SMS templates',
      'Patient database',
      'Email support'
    ]
  },
  growth: {
    id: 'price_growth_monthly',
    name: 'Growth',
    price: 399,
    smsIncluded: 5000,
    maxPatients: 500,
    maxTherapists: 10,
    features: [
      'Everything in Starter',
      'Advanced SMS campaigns',
      'Exercise reminders',
      'Progress tracking',
      'Priority support'
    ]
  },
  pro: {
    id: 'price_pro_monthly',
    name: 'Professional',
    price: 799,
    smsIncluded: 15000,
    maxPatients: 1000,
    maxTherapists: 25,
    features: [
      'Everything in Growth',
      'Custom integrations',
      'Advanced analytics',
      'Dedicated support',
      'API access'
    ]
  }
} as const;

export type BillingPlan = keyof typeof BILLING_PLANS;

// SMS overage pricing (per message after included limit)
export const SMS_OVERAGE_RATE = 0.05; // $0.05 per SMS

// Stripe webhook events we handle
export const STRIPE_WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.trial_will_end',
  'customer.subscription.trial_ended'
] as const;

export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[number];

// Helper to get plan details
export function getPlanDetails(planId: string) {
  return Object.values(BILLING_PLANS).find(plan => plan.id === planId);
}

// Helper to calculate SMS overage charges
export function calculateSMSOverage(planId: string, smsUsed: number): number {
  const plan = getPlanDetails(planId);
  if (!plan) return 0;
  
  const overage = Math.max(0, smsUsed - plan.smsIncluded);
  return overage * SMS_OVERAGE_RATE;
}

// Helper to get next billing date
export function getNextBillingDate(currentPeriodEnd: number): Date {
  return new Date(currentPeriodEnd * 1000);
}

// Helper to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100); // Stripe amounts are in cents
}
