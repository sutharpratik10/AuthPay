import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: { description: 'Missing Razorpay credentials' } }, { status: 500 });
    }

  const { id } = await params as unknown as { id: string };
    if (!id) {
      return NextResponse.json({ success: false, error: { description: 'Missing subscription id' } }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const cancelAtCycleEnd = !!body?.cancel_at_cycle_end;

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Fetch existing subscription
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
    // Call SDK cancel with option
    try {
      // Debug info
      console.log('[razorpay/cancel] calling cancel, id=', id, 'cancel_at_cycle_end=', cancelAtCycleEnd, 'existing.status=', existing.status);
      // @ts-expect-error allow runtime option
      const result = await razorpay.subscriptions.cancel(id, { cancel_at_cycle_end: cancelAtCycleEnd });
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
