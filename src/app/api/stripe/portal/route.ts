import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/billing/actions';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicId } = body;
    
    if (!clinicId) {
      return NextResponse.json(
        { error: 'Clinic ID is required' },
        { status: 400 }
      );
    }

    const result = await createPortalSession(clinicId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
