import { NextRequest, NextResponse } from 'next/server';
import { subscriptionPlanService } from '@/services/subscription-plans';

/**
 * GET /api/subscription-plans/[id] - Get subscription plan by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const plan = await subscriptionPlanService.getSubscriptionPlanById(planId);

    return NextResponse.json({
      success: true,
      data: { plan }
    });

  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    
    if (error instanceof Error && error.message === 'Subscription plan not found') {
      return NextResponse.json(
        { success: false, error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subscription plan' 
      },
      { status: 500 }
    );
  }
}
