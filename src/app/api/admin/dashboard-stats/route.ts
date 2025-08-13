import { db } from '@/db';
import { users, subscriptionPlans } from '@/db/schema';
import { eq, count, sum } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Active users: isActive true
    const activeUsersResult = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const activeUsers = Number(activeUsersResult[0]?.count ?? 0);

    // Tenants: unique subscription users
    const tenantsResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true)); // Adjust if you have a tenant flag
    const tenants = Number(tenantsResult[0]?.count ?? 0);

    // Revenue: sum of all active subscription plans' price (fake, for demo)
    const revenueResult = await db
      .select({ total: sum(subscriptionPlans.price) })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));
    const revenue = revenueResult[0]?.total ? `$${revenueResult[0].total}` : '$0';

    // Errors: not implemented, return 0
    const errors24h = 0;

    return NextResponse.json({
      success: true,
      data: { activeUsers, revenue, errors24h }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
