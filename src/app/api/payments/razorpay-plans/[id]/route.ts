import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { withDynamicApiHandler, errorResponse } from '@/lib/api/helpers';

export const runtime = 'nodejs';

/**
 * GET /api/payments/razorpay-plans/[id]
 * Fetch a specific Razorpay plan by ID
 * 
 * @protected Requires authentication
 * @param {string} id - Plan ID
 */
export const GET = withDynamicApiHandler<{ id: string }>(
  async (request, { user, params }) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return errorResponse('Missing Razorpay credentials', 500);
    }

    const { id } = params;
    if (!id) {
      return errorResponse('Missing plan id', 400);
    }

    console.log(`[razorpay-plans] Fetching plan ${id} for user: ${user?.id}`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const plan = await razorpay.plans.fetch(id);
    
    return NextResponse.json({ success: true, data: plan });
  },
  { requireAuth: true }
);
