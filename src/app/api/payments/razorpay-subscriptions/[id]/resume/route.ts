import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { withDynamicApiHandler, errorResponse } from '@/lib/api/helpers';
import { canAccessSubscription } from '@/lib/api/payment-authorization';

export const runtime = 'nodejs';

/**
 * POST /api/payments/razorpay-subscriptions/[id]/resume
 * Resume a paused Razorpay subscription
 * 
 * @protected Requires authentication
 * @authorization User must own the subscription or be an admin
 * @param {string} id - Subscription ID
 * @body {string|number} resume_at - When to resume ('now' or Unix timestamp)
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
      console.log(`[razorpay-subscriptions/resume] User ${user?.id} denied access to subscription ${id}`);
      return errorResponse('You do not have permission to resume this subscription', 403);
    }

    const body = await request.json().catch(() => ({}));
    const resumeAt = body?.resume_at || 'now';

    console.log(`[razorpay-subscriptions/resume] Resuming subscription ${id} for user: ${user?.id} (admin: ${isAdminUser})`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Fetch existing subscription
    const existing = await razorpay.subscriptions.fetch(id);
    if (!existing) {
      return errorResponse('Subscription not found', 404);
    }

    // Only allow resume if currently paused (runtime may use 'paused')
    if ((existing.status as string) !== 'paused') {
      return errorResponse(`Subscription must be paused to resume (current: ${existing.status})`, 400);
    }

    // Call SDK resume
    const result = await razorpay.subscriptions.resume(id, { resume_at: resumeAt });
    
    console.log(`[razorpay-subscriptions/resume] Successfully resumed subscription ${id}`);
    
    return NextResponse.json(result);
  },
  { requireAuth: true }
);
