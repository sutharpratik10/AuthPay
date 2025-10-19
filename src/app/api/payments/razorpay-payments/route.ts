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
    const count = url.searchParams.get('count') ? Number(url.searchParams.get('count')) : 10;
    const skip = url.searchParams.get('skip') ? Number(url.searchParams.get('skip')) : 0;
    const from = url.searchParams.get('from') ? Number(url.searchParams.get('from')) : undefined;
    const to = url.searchParams.get('to') ? Number(url.searchParams.get('to')) : undefined;
    // optional search query (id, order_id, email)
    const q = url.searchParams.get('q') || undefined;

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

  const params: Record<string, unknown> = { count, skip };
    if (from) params.from = from;
    if (to) params.to = to;
    // The SDK doesn't support q, so we fetch and filter client-side if needed

    const payments = await razorpay.payments.all(params);

    // If q provided, do a simple in-memory filter across id, order_id, email
    if (q && payments && Array.isArray(payments.items)) {
      const ql = q.toLowerCase();
      const items = payments.items as unknown[];
      const filtered = items.filter((p) => {
        const obj = p as Record<string, unknown>;
        const id = typeof obj.id === 'string' ? obj.id.toLowerCase() : '';
        const order_id = obj.order_id ? String(obj.order_id).toLowerCase() : '';
        const email = typeof obj.email === 'string' ? obj.email.toLowerCase() : '';
        return id.includes(ql) || order_id.includes(ql) || email.includes(ql);
      });
      return NextResponse.json({ entity: 'collection', count: filtered.length, items: filtered });
    }

    return NextResponse.json(payments);
  } catch (err) {
    const message = (err instanceof Error) ? err.message : 'Failed to fetch payments';
    console.error('[razorpay/payments] error:', err);
    return NextResponse.json({ success: false, error: { description: message } }, { status: 500 });
  }
}
