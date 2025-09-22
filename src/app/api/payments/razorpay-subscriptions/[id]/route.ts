import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: { description: 'Missing Razorpay credentials' } }, { status: 500 });
    }

  const { id } = await params as unknown as { id: string };
    if (!id) {
      return NextResponse.json({ success: false, error: { description: 'Missing subscription id' } }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const subscription = await razorpay.subscriptions.fetch(id);
    return NextResponse.json(subscription);
  } catch (err) {
    const message = (err instanceof Error) ? err.message : 'Failed to fetch subscription';
    return NextResponse.json({ success: false, error: { description: message } }, { status: 500 });
  }
}
