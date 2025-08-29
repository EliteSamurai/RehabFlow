import type { Stripe } from 'stripe';

// Billing plan information
export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  smsIncluded: number;
  maxPatients: number;
  maxTherapists: number;
  features: string[];
}

// Clinic subscription status
export interface ClinicSubscription {
  id: string;
  clinicId: string;
  planId: string;
  stripeSubscriptionId: string | null;
  customerId: string | null;
  smsSubscriptionItemId: string | null;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Usage tracking
export interface UsageData {
  clinicId: string;
  currentPeriod: {
    start: Date;
    end: Date;
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

// Invoice information
export interface InvoiceData {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  dueDate: Date | null;
  paidAt: Date | null;
  periodStart: Date;
  periodEnd: Date;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  unitAmount: number;
}

// Stripe checkout session
export interface CheckoutSessionData {
  planId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}

// Billing portal session
export interface PortalSessionData {
  returnUrl: string;
}

// Webhook event data
export interface WebhookEventData {
  type: string;
  data: {
    object: Stripe.Event.Data.Object;
  };
}
