import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { db } from '@/server/db';
import { subscriptionPlans, userSubscriptions, subscriptionStatuses } from '@/server/db/schema';
import { eq, inArray, and } from 'drizzle-orm';

async function updateSubscriptionPlan(req: NextRequest, context?: unknown) {
  try {
    const { params: paramsPromise } = context as { params: Promise<{ planId: string }> };
    const params = await paramsPromise;
    const { planId } = params;
    const body = await req.json();
    const {
      name,
      description,
      price,
      billingCycle,
      features,
      isActive,
      razorpay_subscription_id,
      razorpay_subscription_plan_id,
      razorpay_subscription_link
    } = body;

    // Validate required fields
    if (!name || !price || !billingCycle) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name, price, and billing cycle are required' 
        },
        { status: 400 }
      );
    }

    // Validate billing cycle
    const validBillingCycles = ['monthly', 'yearly', 'quarterly', 'one-time'];
    if (!validBillingCycles.includes(billingCycle)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid billing cycle. Must be one of: ' + validBillingCycles.join(', ')
        },
        { status: 400 }
      );
    }

    // Check if plan exists
    const existingPlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (existingPlan.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subscription plan not found' 
        },
        { status: 404 }
      );
    }

    // Prepare features JSON
    const featuresJson = Array.isArray(features) && features.length > 0 
      ? JSON.stringify(features) 
      : null;

    // Update the subscription plan
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        price: price.toString(),
        billingCycle,
        features: featuresJson,
        isActive: Boolean(isActive),
        razorpaySubscriptionId: razorpay_subscription_id || null,
        razorpaySubscriptionPlanId: razorpay_subscription_plan_id || null,
        razorpaySubscriptionLink: razorpay_subscription_link || null,
        updatedAt: new Date()
      })
      .where(eq(subscriptionPlans.id, planId))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        plan: updatedPlan,
        message: 'Subscription plan updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update subscription plan' 
      },
      { status: 500 }
    );
  }
}

async function deleteSubscriptionPlan(req: NextRequest, context?: unknown) {
  try {
    const { params: paramsPromise } = context as { params: Promise<{ planId: string }> };
    const params = await paramsPromise;
    const { planId } = params;

    // Check if plan exists
    const existingPlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (existingPlan.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subscription plan not found' 
        },
        { status: 404 }
      );
    }

    // Get status IDs for 'active' and 'trialing'
    const activeOrTrialingStatuses = await db
      .select({ id: subscriptionStatuses.id })
      .from(subscriptionStatuses)
      .where(inArray(subscriptionStatuses.name, ['active', 'trialing']));
    const statusIds = activeOrTrialingStatuses.map((row: { id: string }) => row.id);

    let associatedUsers = [];
    if (statusIds.length > 0) {
      associatedUsers = await db
        .select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.planId, planId),
          inArray(userSubscriptions.statusId, statusIds)
        ))
        .limit(1);
    }

    if (associatedUsers.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete plan that is currently assigned to users with active or trialing subscriptions. Please reassign or expire those subscriptions first.' 
        },
        { status: 400 }
      );
    }

    // Delete the subscription plan
    await db
      .delete(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId));

    return NextResponse.json({
      success: true,
      data: {
        message: 'Subscription plan deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete subscription plan' 
      },
      { status: 500 }
    );
  }
}

// Export the route handlers wrapped with admin policy checking
export const PUT = withPolicy(updateSubscriptionPlan, API_POLICIES.SUBSCRIPTION_MANAGE);
export const DELETE = withPolicy(deleteSubscriptionPlan, API_POLICIES.SUBSCRIPTION_MANAGE);
