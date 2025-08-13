import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { userSubscriptions, subscriptionPlans, subscriptionStatuses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getExpiryStatus } from '@/lib/subscription-utils';

/**
 * GET /api/user/subscription-status - Get current user's subscription status
 */

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Use explicit join instead of relations
    const rows = await db
      .select({
        planId: userSubscriptions.planId,
        startDate: userSubscriptions.startDate,
        expiryDate: userSubscriptions.expiryDate,
        subStatus: userSubscriptions.statusId, // <-- use statusId
        planName: subscriptionPlans.name,
        planDescription: subscriptionPlans.description,
        planPrice: subscriptionPlans.price,
        billingCycle: subscriptionPlans.billingCycle,
        planFeatures: subscriptionPlans.features,
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    const sub = rows[0];

    if (!sub || !sub.planId) {
      return NextResponse.json({
        success: true,
        data: { hasSubscription: false, message: 'No subscription found' }
      });
    }

    // features may be stored as JSON text
    const features =
      typeof sub.planFeatures === 'string'
        ? (() => { try { return JSON.parse(sub.planFeatures); } catch { return []; } })()
        : Array.isArray(sub.planFeatures) ? sub.planFeatures : [];

    const expiry = sub.expiryDate ? new Date(sub.expiryDate) : null;
    const now = new Date();
    let status = '';
    let isActive = false;

    // Fetch status name from subscriptionStatuses table using statusId
    if (sub.subStatus) {
      const statusRow = await db.query.subscriptionStatuses.findFirst({
        where: eq(subscriptionStatuses.id, sub.subStatus),
        columns: { name: true }
      });
      status = statusRow?.name || '';
    }

    // If expired, override status and isActive
    if (expiry && expiry <= now) {
      status = 'expired';
      isActive = false;
    } else if (status === 'active') {
      isActive = true;
    } else if (status === 'cancelled') {
      isActive = false;
      status = 'cancelled';
    }

    const expiryStatus = getExpiryStatus(expiry);

    // --- Update expired subscriptions for this user before returning status ---
    try {
      const { eq, lt, and, ne } = await import("drizzle-orm");
      // Get the 'expired' status id
      const expiredStatus = await db.query.subscriptionStatuses.findFirst({
        where: eq(subscriptionStatuses.name, 'expired'),
        columns: { id: true }
      });
      if (expiredStatus?.id && userId) {
        // Update all userSubscriptions for this user where expiryDate < now and statusId != expired
        await db.update(userSubscriptions)
          .set({ statusId: expiredStatus.id, updatedAt: new Date().toISOString() })
          .where(and(
            eq(userSubscriptions.userId, userId),
            lt(userSubscriptions.expiryDate, new Date().toISOString()),
            ne(userSubscriptions.statusId, expiredStatus.id)
          ));
      }
    } catch (e) {
      console.error('Failed to update expired subscriptions in subscription-status API:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        hasSubscription: true,
        planId: sub.planId,
        planName: sub.planName,
        planDescription: sub.planDescription,
        price: typeof sub.planPrice === 'number' ? `$${sub.planPrice}` : sub.planPrice,
        billingCycle: sub.billingCycle,
        features,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        isActive,
        status,
        message: expiryStatus.message,
        daysRemaining: expiryStatus.daysRemaining
      }
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    return NextResponse.json({ error: 'Failed to get subscription status' }, { status: 500 });
  }
}

/**
 * POST /api/user/subscription-status - Update Status_id to "expired" if the currrent date is > expiryDate for subscriptions of the current user
 */

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;
    const { eq, lt, and, ne } = await import("drizzle-orm");
    // Get the 'expired' status id
    const expiredStatus = await db.query.subscriptionStatuses.findFirst({
      where: eq(subscriptionStatuses.name, 'expired'),
      columns: { id: true }
    });
    if (expiredStatus?.id && userId) {
      // Update all userSubscriptions for this user where expiryDate < now and statusId != expired
      const result = await db.update(userSubscriptions)
        .set({ statusId: expiredStatus.id, updatedAt: new Date().toISOString() })
        .where(and(
          eq(userSubscriptions.userId, userId),
          lt(userSubscriptions.expiryDate, new Date().toISOString()),
          ne(userSubscriptions.statusId, expiredStatus.id)
        ));
      return NextResponse.json({ success: true, updated: result });
    }
    return NextResponse.json({ success: false, message: 'No expired subscriptions to update.' });
  } catch (e) {
    console.error('Failed to update expired subscriptions in POST /subscription-status:', e);
    return NextResponse.json({ success: false, error: 'Failed to update expired subscriptions.' }, { status: 500 });
  }
}
