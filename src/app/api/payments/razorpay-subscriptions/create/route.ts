import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/server/db';
import { subscriptionPlans } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { withApiHandler, errorResponse } from '@/lib/api/helpers';

export const runtime = 'nodejs';

/**
 * POST /api/payments/razorpay-subscriptions/create
 * Create a new Razorpay subscription
 * 
 * @protected Requires authentication
 * @body {string} planId - Local subscription plan ID (optional if razorpayPlanId provided)
 * @body {string} razorpayPlanId - Razorpay plan ID (optional if planId provided)
 * @body {boolean} customer_notify - Whether to notify customer (default: true)
 * @body {number} total_count - Total billing cycles (default: 12)
 * @body {number} end_at - Unix timestamp for subscription end
 */
export const POST = withApiHandler(
  async (request, { user }) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return errorResponse('Missing Razorpay credentials', 500);
    }

    const body = await request.json();
    const { planId, razorpayPlanId, customer_notify, total_count, end_at } = body || {};

    // Resolve a razorpay plan id: prefer explicit razorpayPlanId, else lookup local plan
    let rpPlanId: string | undefined = undefined;
    if (typeof razorpayPlanId === 'string' && razorpayPlanId.trim()) {
      rpPlanId = razorpayPlanId.trim();
    } else if (typeof planId === 'string' && planId.trim()) {
      const plan = await db.query.subscriptionPlans.findFirst({ 
        where: eq(subscriptionPlans.id, planId), 
        columns: { razorpaySubscriptionPlanId: true } 
      });
      rpPlanId = plan?.razorpaySubscriptionPlanId ?? undefined;
    }

    if (!rpPlanId) {
      return errorResponse('Missing planId or razorpayPlanId', 400);
    }

    console.log(`[razorpay-subscriptions/create] Creating subscription for user: ${user?.id}, plan: ${rpPlanId}`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    const payload: Record<string, unknown> = {
      plan_id: rpPlanId,
      customer_notify: customer_notify === undefined ? true : Boolean(customer_notify),
    };

    // If end_at was provided use it; otherwise include total_count. Razorpay requires one of them.
    if (end_at) {
      payload.end_at = Number(end_at);
    } else if (typeof total_count === 'number' && Number.isFinite(total_count)) {
      payload.total_count = Number(total_count);
    } else {
      // sensible default: create a 12-cycle subscription (one year of monthly billing or 12 periods)
      payload.total_count = 12;
    }

    // @ts-expect-error - razorpay SDK has dynamic types for subscriptions.create
    const created = await razorpay.subscriptions.create(payload);

    return NextResponse.json({ success: true, subscription: created });
  },
  { requireAuth: true }
);
