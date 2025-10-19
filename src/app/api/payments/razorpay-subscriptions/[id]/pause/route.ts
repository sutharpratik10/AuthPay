import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

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
    // Accept optional pause_at timestamp or 'now'
    const optionsParam: { pause_at?: 'now' | number } = {};
    if (body && body.pause_at) {
      const val = body.pause_at;
      if (val === 'now' || typeof val === 'number') {
        optionsParam.pause_at = val;
      }
    }

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Fetch current subscription to validate state
    const existing = await razorpay.subscriptions.fetch(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: { description: 'Subscription not found' } }, { status: 404 });
    }

    // Only allow pause for subscriptions in 'active' state
    if (existing.status !== 'active') {
      return NextResponse.json({ success: false, error: { description: `Subscription must be active to pause (current: ${existing.status})` } }, { status: 400 });
    }

    // Default to 'now' if not provided
    if (!optionsParam.pause_at) optionsParam.pause_at = 'now';

    // SDK types are strict; allow runtime options via ts-expect-error
    // @ts-expect-error Allow runtime option shapes not covered by SDK types
    const result = await razorpay.subscriptions.pause(id, optionsParam);
    return NextResponse.json(result);
  } catch (err) {
    const message = (err instanceof Error) ? err.message : 'Failed to pause subscription';
    return NextResponse.json({ success: false, error: { description: message } }, { status: 500 });
  }
}
