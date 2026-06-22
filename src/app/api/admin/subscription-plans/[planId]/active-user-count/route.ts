import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { userSubscriptions, subscriptionStatuses } from '@/server/db/schema';
import { eq, inArray, and, count } from 'drizzle-orm';
import { rateLimiters } from '@/lib/middleware/rate-limit';

// /api/admin/subscription-plans/[planId]/active-user-count
/**
 * Rate Limited: 60 requests per minute
 */
export const GET = rateLimiters.api(async (
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) => {
  const { planId } = await context.params; 

  try {
    const statusRows = await db
      .select({ id: subscriptionStatuses.id })
      .from(subscriptionStatuses)
      .where(inArray(subscriptionStatuses.name, ['active', 'trialing']));
    const statusIds = statusRows.map(r => r.id);

    let countValue = 0;
    if (statusIds.length > 0) {
      const result = await db
        .select({ value: count() })
        .from(userSubscriptions)
        .where(and(eq(userSubscriptions.planId, planId), inArray(userSubscriptions.statusId, statusIds)));
      countValue = Number(result[0]?.value ?? 0);
    }

    return NextResponse.json({ count: countValue });
  } catch (error) {
    console.error('Error fetching active user count:', error);
    return NextResponse.json({ count: 0, error: 'Failed to fetch active user count' }, { status: 500 });
  }
});
