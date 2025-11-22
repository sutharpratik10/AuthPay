import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { userSubscriptions, subscriptionPlans, subscriptionStatuses } from '@/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 60 requests per minute
 */
export const GET = rateLimiters.api(async (req: NextRequest) =>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;
    // Get all subscriptions for the user, newest first
    const rows = await db
      .select({
        planName: subscriptionPlans.name,
        statusId: userSubscriptions.statusId,
        startDate: userSubscriptions.startDate,
        expiryDate: userSubscriptions.expiryDate,
        endDate: userSubscriptions.endDate,
        amount: subscriptionPlans.price, // Add price as amount
        razorpaySubscriptionId: userSubscriptions.razorpaySubscriptionId,
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt));

    // Fetch all status names in one go for mapping
    const statusIds = Array.from(new Set(rows.map(r => r.statusId).filter(Boolean)));
    let statusMap: Record<string, string> = {};
    if (statusIds.length > 0) {
      const statuses = await db
        .select({ id: subscriptionStatuses.id, name: subscriptionStatuses.name })
        .from(subscriptionStatuses)
        .where(inArray(subscriptionStatuses.id, statusIds));
      statusMap = Object.fromEntries(statuses.map(s => [s.id, s.name]));
    }

    const history = rows.map(r => ({
      planName: r.planName,
      status: statusMap[r.statusId] || '',
      startDate: r.startDate,
      expiryDate: r.expiryDate,
      endDate: r.endDate,
      amount: r.amount,
      razorpaySubscriptionId: r.razorpaySubscriptionId,
    }));

    return NextResponse.json({ success: true, data: { history } });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch subscription history' }, { status: 500 });
  }
});
