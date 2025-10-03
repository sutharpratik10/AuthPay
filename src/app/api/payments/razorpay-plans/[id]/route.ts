import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: { description: 'Missing Razorpay credentials' } }, { status: 500 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: { description: 'Missing plan id' } }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const plan = await razorpay.plans.fetch(id);
    return NextResponse.json({ success: true, data: plan });
  } catch (err) {
    const message = (err instanceof Error) ? err.message : 'Failed to fetch plan';
    return NextResponse.json({ success: false, error: { description: message } }, { status: 500 });
  }
}
