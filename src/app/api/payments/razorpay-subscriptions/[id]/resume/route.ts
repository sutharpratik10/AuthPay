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
    const resumeAt = body?.resume_at || 'now';

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Fetch existing subscription
    const existing = await razorpay.subscriptions.fetch(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: { description: 'Subscription not found' } }, { status: 404 });
    }

    // Only allow resume if currently paused (runtime may use 'paused')
    if ((existing.status as string) !== 'paused') {
      return NextResponse.json({ success: false, error: { description: `Subscription must be paused to resume (current: ${existing.status})` } }, { status: 400 });
    }

  // Call SDK resume
  const result = await razorpay.subscriptions.resume(id, { resume_at: resumeAt });
    return NextResponse.json(result);
  } catch (err) {
    const message = (err instanceof Error) ? err.message : 'Failed to resume subscription';
    return NextResponse.json({ success: false, error: { description: message } }, { status: 500 });
  }
}
