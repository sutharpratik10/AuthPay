import { NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptionPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/subscription-plans - Get all active subscription plans (public)
 */
export async function GET() {
  try {
    // Get all active subscription plans
    const plans = await db.query.subscriptionPlans.findMany({
      where: eq(subscriptionPlans.isActive, true),
      columns: {
        id: true,
        name: true,
        description: true,
        price: true,
        billingCycle: true,
        features: true,
        createdAt: true
      },
      orderBy: (plans, { asc }) => [asc(plans.name)]
    });

    // Parse features for each plan
    const formattedPlans = plans.map(plan => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : [],
      priceNumber: parseFloat(plan.price.replace(/[^0-9.]/g, ''))
    }));

    return NextResponse.json({
      success: true,
      data: {
        plans: formattedPlans
      }
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
