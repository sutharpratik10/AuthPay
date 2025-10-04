import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { userSubscriptions, subscriptionStatuses } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: { description: 'Missing Razorpay credentials' } }, { status: 500 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: { description: 'Missing subscription id' } }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const cancelAtCycleEnd = !!body?.cancel_at_cycle_end;

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Fetch existing subscription to validate status
    const existing = await razorpay.subscriptions.fetch(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: { description: 'Subscription not found' } }, { status: 404 });
    }

    // Disallow cancelling when subscription hasn't entered a billing cycle
    // Razorpay returns 400 for 'created' subscriptions — only allow cancel for 'active' or 'paused'
    const statusStr = String(existing.status);
    if (statusStr !== 'active' && statusStr !== 'paused') {
      return NextResponse.json({ success: false, error: { description: `Subscription in status '${statusStr}' cannot be cancelled` } }, { status: 400 });
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
        return NextResponse.json({ 
          success: false, 
          error: { description: errorData?.error?.description || 'Failed to cancel subscription on Razorpay' } 
        }, { status: cancelResponse.status });
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
                eq(userSubscriptions.razorpaySubscriptionId, id)
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
                eq(userSubscriptions.razorpaySubscriptionId, id)
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
      return NextResponse.json({ success: false, error: { description: sdkMessage } }, { status: 500 });
    }
  } catch (err) {
  const message = (err instanceof Error) ? err.message : 'Failed to cancel subscription';
  // Log full error for debugging
  console.error('[razorpay/cancel] error:', err);
  return NextResponse.json({ success: false, error: { description: message } }, { status: 500 });
  }
}
