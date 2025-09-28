import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/db';
import { subscriptionPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: 'Missing Razorpay credentials' }, { status: 500 });
    }

  const body = await req.json();
  const { planId, razorpayPlanId, customer_notify, total_count, end_at } = body || {};

    // Resolve a razorpay plan id: prefer explicit razorpayPlanId, else lookup local plan
    let rpPlanId: string | undefined = undefined;
    if (typeof razorpayPlanId === 'string' && razorpayPlanId.trim()) rpPlanId = razorpayPlanId.trim();
    else if (typeof planId === 'string' && planId.trim()) {
      const plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.id, planId), columns: { razorpaySubscriptionPlanId: true } });
      rpPlanId = plan?.razorpaySubscriptionPlanId ?? undefined;
    }

    if (!rpPlanId) return NextResponse.json({ success: false, error: 'Missing planId or razorpayPlanId' }, { status: 400 });

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
  } catch (err) {
    // Try to surface Razorpay's error details when available
    console.error('Create subscription error', err);
    const e = err as unknown;
    if (e && typeof e === 'object') {
      const obj = e as Record<string, unknown>;
      if (obj.error && typeof obj.error === 'object') {
        const errObj = obj.error as Record<string, unknown>;
        if (errObj.description) {
          const desc = String(errObj.description);
          const statusCode = typeof obj.statusCode === 'number' ? obj.statusCode : 500;
          return NextResponse.json({ success: false, error: desc }, { status: statusCode });
        }
      }
    }
    return NextResponse.json({ success: false, error: (err as Error).message || 'Failed to create subscription' }, { status: 500 });
  }
}
