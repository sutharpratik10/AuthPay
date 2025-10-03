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
  razorpaySubscriptionId: userSubscriptions.razorpaySubscriptionId,
  razorpayCustomerId: userSubscriptions.razorpayCustomerId,
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

    // If there's no subscription row, or neither a local plan nor a Razorpay subscription id, report no subscription
    if (!sub || (!sub.planId && !sub.razorpaySubscriptionId)) {
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

    // If plan is missing (Razorpay-only subscription), features should be empty array
    const effectiveFeatures = features ?? [];

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

    // Determine access status based on expiry date and subscription status
    if (expiry && expiry <= now) {
      // Subscription has expired
      if (status === 'cancelled') {
        status = 'cancelled'; // Keep cancelled status even after expiry
      } else {
        status = 'expired';
      }
      isActive = false;
    } else if (status === 'active') {
      isActive = true;
    } else if (status === 'cancelled') {
      // Cancelled but not yet expired - user still has access
      if (expiry && expiry > now) {
        isActive = true; // User retains access until expiry date
      } else {
        isActive = false;
      }
      status = 'cancelled';
    }

    const expiryStatus = getExpiryStatus(expiry);

    // --- Update expired subscriptions for this user before returning status ---
    try {
      const { eq, lt, and, ne } = await import("drizzle-orm");
      // Get the 'expired' and 'cancelled' status ids
      const [expiredStatus, cancelledStatus] = await Promise.all([
        db.query.subscriptionStatuses.findFirst({
          where: eq(subscriptionStatuses.name, 'expired'),
          columns: { id: true }
        }),
        db.query.subscriptionStatuses.findFirst({
          where: eq(subscriptionStatuses.name, 'cancelled'),
          columns: { id: true }
        })
      ]);
      
      if (expiredStatus?.id && userId) {
        // Update all userSubscriptions for this user where expiryDate < now 
        // and statusId is not expired or cancelled (preserve cancelled status)
        await db.update(userSubscriptions)
          .set({ statusId: expiredStatus.id, updatedAt: new Date().toISOString() })
          .where(and(
            eq(userSubscriptions.userId, userId),
            lt(userSubscriptions.expiryDate, new Date().toISOString()),
            ne(userSubscriptions.statusId, expiredStatus.id),
            cancelledStatus?.id ? ne(userSubscriptions.statusId, cancelledStatus.id) : undefined
          ));
      }
    } catch (e) {
      console.error('Failed to update expired subscriptions in subscription-status API:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        hasSubscription: true,
        planId: sub.planId ?? null,
        planName: sub.planName ?? null,
        planDescription: sub.planDescription ?? null,
        price: typeof sub.planPrice === 'number' ? `$${sub.planPrice}` : (sub.planPrice ?? null),
        billingCycle: sub.billingCycle ?? 'monthly',
        features: effectiveFeatures,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        isActive,
        status,
        razorpaySubscriptionId: sub.razorpaySubscriptionId ?? null,
        razorpayCustomerId: sub.razorpayCustomerId ?? null,
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
    
    // Get the 'expired' and 'cancelled' status ids
    const [expiredStatus, cancelledStatus] = await Promise.all([
      db.query.subscriptionStatuses.findFirst({
        where: eq(subscriptionStatuses.name, 'expired'),
        columns: { id: true }
      }),
      db.query.subscriptionStatuses.findFirst({
        where: eq(subscriptionStatuses.name, 'cancelled'),
        columns: { id: true }
      })
    ]);
    
    if (expiredStatus?.id && userId) {
      const excludeStatuses = [expiredStatus.id];
      if (cancelledStatus?.id) {
        excludeStatuses.push(cancelledStatus.id);
      }
      
      // Update all userSubscriptions for this user where expiryDate < now 
      // and statusId is not expired or cancelled (don't override cancelled subscriptions)
      const result = await db.update(userSubscriptions)
        .set({ statusId: expiredStatus.id, updatedAt: new Date().toISOString() })
        .where(and(
          eq(userSubscriptions.userId, userId),
          lt(userSubscriptions.expiryDate, new Date().toISOString()),
          ne(userSubscriptions.statusId, expiredStatus.id),
          cancelledStatus?.id ? ne(userSubscriptions.statusId, cancelledStatus.id) : undefined
        ));
      return NextResponse.json({ success: true, updated: result });
    }
    return NextResponse.json({ success: false, message: 'No expired subscriptions to update.' });
  } catch (e) {
    console.error('Failed to update expired subscriptions in POST /subscription-status:', e);
    return NextResponse.json({ success: false, error: 'Failed to update expired subscriptions.' }, { status: 500 });
  }
}
