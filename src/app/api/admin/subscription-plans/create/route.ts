import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api/permissions';
import { db } from '@/server/db';
import { subscriptionPlans } from '@/server/db/schema';

async function createSubscriptionPlan(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      billingCycle,
      features,
      isActive = true,
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

    // Prepare features JSON
    const featuresJson = Array.isArray(features) && features.length > 0 
      ? JSON.stringify(features) 
      : null;

    // Create the subscription plan
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        price: price.toString(),
        billingCycle,
        features: featuresJson,
        isActive: Boolean(isActive),
        razorpaySubscriptionId: razorpay_subscription_id || null,
        razorpaySubscriptionPlanId: razorpay_subscription_plan_id || null,
        razorpaySubscriptionLink: razorpay_subscription_link || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        plan: newPlan,
        message: 'Subscription plan created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create subscription plan' 
      },
      { status: 500 }
    );
  }
}

// Export the route handler wrapped with admin permission checking
export const POST = withPermission(createSubscriptionPlan, API_PERMISSIONS.SUBSCRIPTION_MANAGE);
