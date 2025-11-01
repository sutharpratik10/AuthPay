import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { withDynamicApiHandler, errorResponse } from '@/lib/api/helpers';
import { canAccessSubscription } from '@/lib/api/payment-authorization';

export const runtime = 'nodejs';

/**
 * GET /api/payments/razorpay-subscriptions/[id]
 * Fetch a specific Razorpay subscription by ID
 * 
 * @protected Requires authentication
 * @authorization Admins can see any subscription, users can only see their own
 * @param {string} id - Subscription ID
 */
export const GET = withDynamicApiHandler<{ id: string }>(
  async (request, { user, params }) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return errorResponse('Missing Razorpay credentials', 500);
    }

    const { id } = params;
    if (!id) {
      return errorResponse('Missing subscription id', 400);
    }

    // Check if user can access this subscription
    const { canAccess, isAdmin: isAdminUser } = await canAccessSubscription(user!.id, id);
    
    if (!canAccess) {
      console.log(`[razorpay-subscriptions] User ${user?.id} denied access to subscription ${id}`);
      return errorResponse('You do not have permission to access this subscription', 403);
    }

    console.log(`[razorpay-subscriptions] Fetching subscription ${id} for user: ${user?.id} (admin: ${isAdminUser})`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const subscription = await razorpay.subscriptions.fetch(id);
    
    return NextResponse.json(subscription);
  },
  { requireAuth: true }
);
