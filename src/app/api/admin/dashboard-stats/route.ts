import { db } from '@/server/db';
import { users, subscriptionPlans } from '@/server/db/schema';
import { eq, count, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 60 requests per minute
 */
export const GET = rateLimiters.api(async (req: NextRequest) =>) {
  try {
    // Active users: isActive true
    const activeUsersResult = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const activeUsers = Number(activeUsersResult[0]?.count ?? 0);

    // Revenue: sum of all active subscription plans' price (convert VARCHAR to numeric)
    const revenueResult = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(CAST(REGEXP_REPLACE(${subscriptionPlans.price}, '[^0-9.]', '', 'g') AS DECIMAL)), 0)` 
      })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));
    
    const revenueValue = Number(revenueResult[0]?.total ?? 0);
    const revenue = `$${revenueValue.toFixed(2)}`;

    // Errors: not implemented, return 0
    const errors24h = 0;

    return NextResponse.json({
      success: true,
      data: { activeUsers, revenue, errors24h }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
});
