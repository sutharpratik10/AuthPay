import { NextResponse } from 'next/server';
import { subscriptionPlanService } from '@/server/services/subscription-plans';

/**
 * GET /api/subscription-plans - Get all active subscription plans (public)
 */
export async function GET() {
  try {
    const plans = await subscriptionPlanService.getActiveSubscriptionPlans();

    return NextResponse.json({
      success: true,
      data: {
        plans,
        count: plans.length
      }
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subscription plans' 
      },
      { status: 500 }
    );
  }
}
