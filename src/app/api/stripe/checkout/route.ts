import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/billing/actions';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';

const checkoutSchema = z.object({
  planId: z.enum(['starter', 'growth', 'pro']),
  trialDays: z.number().min(0).max(30).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, trialDays = 14 } = checkoutSchema.parse(body);
    
    // Get user's clinic ID from auth
    const user = await requireUser();
    if (!user.clinic_id) {
      return NextResponse.json(
        { error: 'User not associated with a clinic' },
        { status: 403 }
      );
    }

    const result = await createCheckoutSession(planId, user.clinic_id, trialDays);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
