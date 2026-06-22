import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { userSubscriptions, subscriptionStatuses } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { withDynamicApiHandler, errorResponse } from '@/lib/api/helpers';
import { canAccessSubscription } from '@/lib/api/payment-authorization';

export const runtime = 'nodejs';

/**
 * POST /api/payments/razorpay-subscriptions/[id]/cancel
 * Cancel a Razorpay subscription
 * 
 * @protected Requires authentication
 * @authorization User must own the subscription or be an admin
 * @param {string} id - Subscription ID
 * @body {boolean} cancel_at_cycle_end - Whether to cancel at end of billing cycle
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
      console.log(`[razorpay-subscriptions/cancel] User ${user?.id} denied access to subscription ${id}`);
      return errorResponse('You do not have permission to cancel this subscription', 403);
    }

    const body = await request.json().catch(() => ({}));
    const cancelAtCycleEnd = !!body?.cancel_at_cycle_end;

    console.log(`[razorpay-subscriptions/cancel] Cancelling subscription ${id} for user: ${user?.id} (admin: ${isAdminUser})`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Fetch existing subscription to validate status
    const existing = await razorpay.subscriptions.fetch(id);
    if (!existing) {
      return errorResponse('Subscription not found', 404);
    }

    // Disallow cancelling when subscription hasn't entered a billing cycle
    // Razorpay returns 400 for 'created' subscriptions — only allow cancel for 'active' or 'paused'
    const statusStr = String(existing.status);
    if (statusStr !== 'active' && statusStr !== 'paused') {
      return errorResponse(`Subscription in status '${statusStr}' cannot be cancelled`, 400);
    }

    // Call Razorpay API directly using POST endpoint
    try {
      // Debug info
      console.log('[razorpay/cancel] calling cancel API, id=', id, 'cancel_at_cycle_end=', cancelAtCycleEnd, 'existing.status=', existing.status);
      
      // Use Razorpay's REST API directly with basic auth
      const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const cancelResponse = await fetch(`https://api.razorpay.com/v1/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancel_at_cycle_end: cancelAtCycleEnd
        })
      });

      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.json().catch(() => ({}));
        console.error('[razorpay/cancel] API error:', errorData);
        return errorResponse(
          errorData?.error?.description || 'Failed to cancel subscription on Razorpay',
          cancelResponse.status
        );
      }

      const result = await cancelResponse.json();
      console.log('[razorpay/cancel] Successfully cancelled on Razorpay:', result);
      
      // After successful cancellation on Razorpay, update local database
      try {
        const session = await auth();
        if (session?.user?.id) {
          // Get the 'cancelled' status id
          const cancelledStatus = await db.query.subscriptionStatuses.findFirst({
            where: eq(subscriptionStatuses.name, 'cancelled'),
            columns: { id: true }
          });

          if (cancelledStatus?.id) {
            // Fetch the current subscription to get the expiryDate
            const currentSub = await db.query.userSubscriptions.findFirst({
              where: and(
                eq(userSubscriptions.userId, session.user.id),
                eq(userSubscriptions.providerSubscriptionId, id)
              ),
              columns: { expiryDate: true }
            });

            // Update the user's subscription to cancelled status
            // NOTE: We keep the original expiryDate so user has access until billing period ends
            // endDate is NOT set immediately - it will be set when expiryDate is reached
            await db.update(userSubscriptions)
              .set({ 
                statusId: cancelledStatus.id,
                // Don't set endDate yet - user keeps access until expiryDate
                updatedAt: new Date().toISOString()
              })
              .where(and(
                eq(userSubscriptions.userId, session.user.id),
                eq(userSubscriptions.providerSubscriptionId, id)
              ));
            
            console.log('[razorpay/cancel] Updated local database for user:', session.user.id, 'Access until:', currentSub?.expiryDate);
          }
        }
      } catch (dbErr) {
        console.error('[razorpay/cancel] Failed to update local database:', dbErr);
        // Don't fail the request if DB update fails, Razorpay cancellation was successful
      }
      
      return NextResponse.json(result);
    } catch (sdkErr) {
      console.error('[razorpay/cancel] sdk error:', sdkErr);
      const sdkMessage = (sdkErr instanceof Error) ? sdkErr.message : 'Razorpay SDK cancel failed';
      return errorResponse(sdkMessage, 500);
    }
  },
  { requireAuth: true }
);
