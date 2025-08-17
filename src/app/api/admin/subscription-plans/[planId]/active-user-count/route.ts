import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userSubscriptions, subscriptionStatuses } from '@/db/schema';
import { eq, inArray, and, count } from 'drizzle-orm';

// /api/admin/subscription-plans/[planId]/active-user-count
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params; 

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
}
