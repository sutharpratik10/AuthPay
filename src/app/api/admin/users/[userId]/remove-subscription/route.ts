import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { users, userSubscriptions, subscriptionStatuses } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/admin/users/[userId]/remove-subscription - Remove subscription from user (Admin only)
 */
async function removeSubscriptionFromUser(req: NextRequest) {
  try {
    // Extract userId from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 2]; // Get userId from path

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Check if user has a subscription
    const existingSubscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
      columns: { id: true }
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'User has no subscription to remove' },
        { status: 404 }
      );
    }

    // Get the statusId for 'cancelled' status
    const cancelledStatus = await db.query.subscriptionStatuses.findFirst({
      where: eq(subscriptionStatuses.name, 'cancelled'),
      columns: { id: true }
    });
    if (!cancelledStatus) {
      return NextResponse.json(
        { error: 'Cancelled subscription status not found' },
        { status: 500 }
      );
    }

    // Remove subscription by updating statusId and expiry/end dates
    await db.update(userSubscriptions)
      .set({
        statusId: cancelledStatus.id,
        expiryDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(userSubscriptions.userId, userId));

    return NextResponse.json({
      success: true,
      message: 'Subscription removed from user successfully',
      data: {
        userId,
        subscriptionId: existingSubscription.id
      }
    });

  } catch (error) {
    console.error('Remove subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}

// Export route handler with permission checking
export const POST = withPermission(removeSubscriptionFromUser, API_PERMISSIONS.USER_EDIT);
