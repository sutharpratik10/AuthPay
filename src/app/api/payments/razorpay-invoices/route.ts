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
  const count = url.searchParams.get('count') ? Number(url.searchParams.get('count')) : 20;
  const skip = url.searchParams.get('skip') ? Number(url.searchParams.get('skip')) : 0;
  const status = url.searchParams.get('status') || undefined;
  const customer_id = url.searchParams.get('customer_id') || undefined;
  const payment_id = url.searchParams.get('payment_id') || undefined;

  const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

  // Build params object for invoices.all. subscription_id is optional; if present include it.
  const params: Record<string, unknown> = { count, skip };
  if (subscription_id) params.subscription_id = subscription_id;
  if (status) params.status = status;
  if (customer_id) params.customer_id = customer_id;
  if (payment_id) params.payment_id = payment_id;

  const invoices = await razorpay.invoices.all(params as unknown as Record<string, unknown>);
    return NextResponse.json(invoices);
  } catch (err) {
    const message = (err instanceof Error) ? err.message : 'Failed to fetch invoices';
    console.error('[razorpay/invoices] error:', err);
    return NextResponse.json({ success: false, error: { description: message } }, { status: 500 });
  }
}
