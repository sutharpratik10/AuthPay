import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { withDynamicApiHandler, errorResponse } from '@/lib/api/helpers';
import { canAccessSubscription } from '@/lib/api/payment-authorization';

export const runtime = 'nodejs';

/**
 * POST /api/payments/razorpay-subscriptions/[id]/pause
 * Pause a Razorpay subscription
 * 
 * @protected Requires authentication
 * @authorization User must own the subscription or be an admin
 * @param {string} id - Subscription ID
 * @body {string|number} pause_at - When to pause ('now' or Unix timestamp)
 */
export const POST = withDynamicApiHandler<{ id: string }>(
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
      console.log(`[razorpay-subscriptions/pause] User ${user?.id} denied access to subscription ${id}`);
      return errorResponse('You do not have permission to pause this subscription', 403);
    }

    const body = await request.json().catch(() => ({}));
    // Accept optional pause_at timestamp or 'now'
    const optionsParam: { pause_at?: 'now' | number } = {};
    if (body && body.pause_at) {
      const val = body.pause_at;
      if (val === 'now' || typeof val === 'number') {
        optionsParam.pause_at = val;
      }
    }

    console.log(`[razorpay-subscriptions/pause] Pausing subscription ${id} for user: ${user?.id} (admin: ${isAdminUser})`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Fetch current subscription to validate state
    const existing = await razorpay.subscriptions.fetch(id);
    if (!existing) {
      return errorResponse('Subscription not found', 404);
    }

    // Only allow pause for subscriptions in 'active' state
    if (existing.status !== 'active') {
      return errorResponse(`Subscription must be active to pause (current: ${existing.status})`, 400);
    }

    // Default to 'now' if not provided
    if (!optionsParam.pause_at) optionsParam.pause_at = 'now';

    // SDK types are strict; allow runtime options via ts-expect-error
    // @ts-expect-error Allow runtime option shapes not covered by SDK types
    const result = await razorpay.subscriptions.pause(id, optionsParam);
    
    console.log(`[razorpay-subscriptions/pause] Successfully paused subscription ${id}`);
    
    return NextResponse.json(result);
  },
  { requireAuth: true }
);
