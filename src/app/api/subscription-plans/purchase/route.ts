import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, subscriptionPlans, userSubscriptions, subscriptionStatuses, subscriptionRenewalTypes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateSubscriptionExpiryDate } from '@/lib/subscription-utils';

/**
 * POST /api/subscription-plans/purchase - Purchase a subscription plan
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if subscription plan exists and is active
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
      columns: { id: true, name: true, billingCycle: true, isActive: true, price: true }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Subscription plan not found or inactive' },
        { status: 404 }
      );
    }

    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate subscription dates
    const startDate = new Date();
    const expiryDate = calculateSubscriptionExpiryDate(startDate, plan.billingCycle);

    // Get status and renewal type UUIDs
    const status = await db.query.subscriptionStatuses.findFirst({
      where: eq(subscriptionStatuses.name, 'active'),
      columns: { id: true }
    });
    const renewalType = await db.query.subscriptionRenewalTypes.findFirst({
      where: eq(subscriptionRenewalTypes.name, 'auto'),
      columns: { id: true }
    });

    if (!status?.id) {
      return NextResponse.json(
        { error: 'Subscription status "active" not found' },
        { status: 500 }
      );
    }
    if (!renewalType?.id) {
      return NextResponse.json(
        { error: 'Subscription renewal type "auto" not found' },
        { status: 500 }
      );
    }

    // Always create a new subscription entry for every purchase
    await db.insert(userSubscriptions).values({
      userId,
      planId: plan.id,
      statusId: status.id,
      renewalTypeId: renewalType.id,
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan`,
      data: {
        planId: plan.id,
        planName: plan.name,
        billingCycle: plan.billingCycle,
        price: plan.price,
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error purchasing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to purchase subscription' },
      { status: 500 }
    );
  }
}
