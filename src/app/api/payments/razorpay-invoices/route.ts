import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: { description: 'Missing Razorpay credentials' } }, { status: 500 });
    }

    const url = new URL(req.url);
    const subscription_id = url.searchParams.get('subscription_id');
    if (!subscription_id) {
      return NextResponse.json({ success: false, error: { description: 'Missing subscription_id query parameter' } }, { status: 400 });
    }

    const count = url.searchParams.get('count') ? Number(url.searchParams.get('count')) : 20;
    const skip = url.searchParams.get('skip') ? Number(url.searchParams.get('skip')) : 0;

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Use invoices.all with subscription_id filter
  const invoices = await razorpay.invoices.all({ subscription_id, count, skip });
    return NextResponse.json(invoices);
  } catch (err) {
    const message = (err instanceof Error) ? err.message : 'Failed to fetch invoices';
    console.error('[razorpay/invoices] error:', err);
    return NextResponse.json({ success: false, error: { description: message } }, { status: 500 });
  }
}
