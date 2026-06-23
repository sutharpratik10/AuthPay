import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { db } from '@/server/db';
import { subscriptionPlans } from '@/server/db/schema';
import { asc, desc } from 'drizzle-orm';
import { subscriptionPlanService } from '@/server/services/subscription-plans';

async function getSubscriptionPlans() {
  try {
    // Get all subscription plans ordered by displayOrder then creation date
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .orderBy(asc(subscriptionPlans.displayOrder), desc(subscriptionPlans.createdAt));

    // Format plans with additional data
    const formattedPlans = plans.map(plan => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : [],
      priceNumber: parseFloat(plan.price.replace(/[^0-9.]/g, '')),
      formattedPrice: plan.price,
      canPurchase: !!plan.razorpaySubscriptionPlanId
    }));

    return NextResponse.json({
      success: true,
      data: {
        plans: formattedPlans,
        count: formattedPlans.length
      }
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription plans'
      },
      { status: 500 }
    );
  }
}

async function createOrUpdateSubscriptionPlan(request: NextRequest) {
  try {
    const body = await request.json();

    const plan = await subscriptionPlanService.upsertSubscriptionPlan(body);

    return NextResponse.json({
      success: true,
      data: { plan },
      message: body.id ? 'Subscription plan updated successfully' : 'Subscription plan created successfully'
    });
  } catch (error) {
    console.error('Error creating/updating subscription plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create/update subscription plan'
      },
      { status: 500 }
    );
  }
}

// Export the route handlers wrapped with admin policy checking
export const GET = withPolicy(getSubscriptionPlans, API_POLICIES.ADMIN_ACCESS);
export const POST = withPolicy(createOrUpdateSubscriptionPlan, API_POLICIES.SUBSCRIPTION_MANAGE);
export const PUT = withPolicy(createOrUpdateSubscriptionPlan, API_POLICIES.SUBSCRIPTION_MANAGE);
