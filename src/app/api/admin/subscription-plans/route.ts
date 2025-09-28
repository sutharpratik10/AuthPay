import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { subscriptionPlans } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { subscriptionPlanService } from '@/services/subscription-plans';

async function getSubscriptionPlans() {
  try {
    // Get all subscription plans ordered by creation date
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .orderBy(desc(subscriptionPlans.createdAt));

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

// Export the route handlers wrapped with admin permission checking
export const GET = withPermission(getSubscriptionPlans, API_PERMISSIONS.SUBSCRIPTION_MANAGE);
export const POST = withPermission(createOrUpdateSubscriptionPlan, API_PERMISSIONS.SUBSCRIPTION_MANAGE);
export const PUT = withPermission(createOrUpdateSubscriptionPlan, API_PERMISSIONS.SUBSCRIPTION_MANAGE);
