import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { userSubscriptions, subscriptionPlans } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getExpiryStatus } from '@/lib/subscription-utils';

/**
 * GET /api/user/subscription-status - Get current user's subscription status
 */

// Define the type for the subscription query result
interface SubscriptionPlan {
  id: string | number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  features?: string;
}
interface UserSubscription {
  plan: SubscriptionPlan;
  expiryDate?: string;
  startDate?: string;
  status: string;
}

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
        subStatus: userSubscriptions.status,
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
    const expiryStatus = getExpiryStatus(expiry);

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
        isActive: sub.subStatus === 'active',
        status: expiryStatus.status,
        message: expiryStatus.message,
        daysRemaining: expiryStatus.daysRemaining
      }
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    return NextResponse.json({ error: 'Failed to get subscription status' }, { status: 500 });
  }
}
