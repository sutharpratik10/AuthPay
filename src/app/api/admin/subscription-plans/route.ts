import { NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { subscriptionPlans } from '@/db/schema';
import { desc } from 'drizzle-orm';

async function getSubscriptionPlans() {
  try {
    // Get all subscription plans ordered by creation date
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .orderBy(desc(subscriptionPlans.createdAt));

    return NextResponse.json({
      success: true,
      data: {
        plans,
        count: plans.length
      }
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subscription plans' 
      },
      { status: 500 }
    );
  }
}

// Export the route handler wrapped with admin permission checking
export const GET = withPermission(getSubscriptionPlans, API_PERMISSIONS.SUBSCRIPTION_MANAGE);
