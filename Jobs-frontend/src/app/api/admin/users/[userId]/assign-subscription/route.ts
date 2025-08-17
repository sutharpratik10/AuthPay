import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { users, subscriptionPlans, userSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateSubscriptionExpiryDate } from '@/lib/subscription-utils';

/**
 * POST /api/admin/users/[userId]/assign-subscription - Assign subscription plan to user (Admin only)
 */
async function assignSubscriptionToUser(req: NextRequest) {
  try {
    // Extract userId from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 2]; // Get userId from path

    const body = await req.json();
    const { planId } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
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

    // Check if subscription plan exists
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
      columns: { id: true, name: true, billingCycle: true }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Calculate subscription dates
    const startDate = new Date();
    const expiryDate = calculateSubscriptionExpiryDate(startDate, plan.billingCycle);

    // Get the statusId for 'active' status
    const activeStatus = await db.query.subscriptionStatuses.findFirst({
      where: eq(subscriptionPlans.name, 'active'),
      columns: { id: true }
    });
    if (!activeStatus) {
      return NextResponse.json(
        { error: 'Active subscription status not found' },
        { status: 500 }
      );
    }

    // Check if user already has a subscription
    const existingSubscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
      columns: { id: true }
    });

    if (existingSubscription) {
      // Update existing subscription
      await db.update(userSubscriptions)
        .set({
          planId: planId,
          statusId: activeStatus.id,
          startDate: startDate.toISOString(),
          expiryDate: expiryDate.toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(userSubscriptions.userId, userId));
    } else {
      // Create new subscription
      await db.insert(userSubscriptions).values({
        userId,
        planId,
        statusId: activeStatus.id,
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: `Subscription plan "${plan.name}" assigned to user successfully`,
      data: {
        userId,
        planId,
        planName: plan.name,
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
      }
    });

  } catch (error) {
    console.error('Assign subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to assign subscription plan' },
      { status: 500 }
    );
  }
}

// Export route handler with permission checking
export const POST = withPermission(assignSubscriptionToUser, API_PERMISSIONS.USER_EDIT);
