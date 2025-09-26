import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id?: string } }) {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: { description: 'Missing Razorpay credentials' } }, { status: 500 });
    }

    const invoiceId = params?.id;
    if (!invoiceId) {
      return NextResponse.json({ success: false, error: { description: 'Invoice id required' } }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const invoice = await razorpay.invoices.fetch(invoiceId);
    return NextResponse.json(invoice);
  } catch (err) {
    const message = (err instanceof Error) ? err.message : 'Failed to fetch invoice';
    console.error('[razorpay/invoices/:id] error:', err);
    return NextResponse.json({ success: false, error: { description: message } }, { status: 500 });
  }
}
