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

/**
 * PATCH /api/payments/razorpay-subscriptions/[id]
 * Update a Razorpay subscription
 * 
 * @protected Requires authentication
 * @authorization User must own the subscription or be an admin
 * @param {string} id - Subscription ID
 * @body {string} plan_id - New plan ID
 * @body {string} offer_id - Offer ID to apply
 * @body {number} quantity - Quantity
 * @body {number} remaining_count - Remaining billing cycles
 * @body {number} start_at - Unix timestamp for new start date
 * @body {string} schedule_change_at - 'now' or 'cycle_end'
 * @body {boolean} customer_notify - Whether to notify customer
 */
export const PATCH = withDynamicApiHandler<{ id: string }>(
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
      console.log(`[razorpay-subscriptions/update] User ${user?.id} denied access to subscription ${id}`);
      return errorResponse('You do not have permission to update this subscription', 403);
    }

    const body = await request.json().catch(() => ({}));
    const {
      plan_id,
      offer_id,
      quantity,
      remaining_count,
      start_at,
      schedule_change_at,
      customer_notify
    } = body;

    console.log(`[razorpay-subscriptions/update] Updating subscription ${id} for user: ${user?.id} (admin: ${isAdminUser})`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Fetch existing subscription to validate
    try {
      const existing = await razorpay.subscriptions.fetch(id);
      if (!existing) {
        return errorResponse('Subscription not found', 404);
      }
    } catch (error) {
      console.error('[razorpay-subscriptions/update] Error fetching subscription:', error);
      return errorResponse('Subscription not found', 404);
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {};
    if (plan_id) updatePayload.plan_id = plan_id;
    if (offer_id) updatePayload.offer_id = offer_id;
    if (quantity !== undefined) updatePayload.quantity = Number(quantity);
    if (remaining_count !== undefined) updatePayload.remaining_count = Number(remaining_count);
    if (start_at !== undefined) updatePayload.start_at = Number(start_at);
    if (schedule_change_at) updatePayload.schedule_change_at = schedule_change_at;
    if (customer_notify !== undefined) updatePayload.customer_notify = Boolean(customer_notify);

    if (Object.keys(updatePayload).length === 0) {
      return errorResponse('No fields to update', 400);
    }

    // Use Razorpay REST API directly with PATCH method
    const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    
    try {
      const updateResponse = await fetch(`https://api.razorpay.com/v1/subscriptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        console.error('[razorpay-subscriptions/update] API error:', errorData);
        return errorResponse(
          errorData?.error?.description || 'Failed to update subscription',
          updateResponse.status
        );
      }

      const result = await updateResponse.json();
      console.log(`[razorpay-subscriptions/update] Successfully updated subscription ${id}`);
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('[razorpay-subscriptions/update] Request failed:', error);
      return errorResponse(
        'Failed to update subscription',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  },
  { requireAuth: true }
);
