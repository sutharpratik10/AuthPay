import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { withDynamicApiHandler, errorResponse } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export const GET = withDynamicApiHandler<{ id?: string }>(
  async (request, { params }) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return errorResponse('Missing Razorpay credentials', 500);
    }

    const invoiceId = params?.id;
    if (!invoiceId) {
      return errorResponse('Invoice id required', 400);
    }

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const invoice = await razorpay.invoices.fetch(invoiceId);
    
    return NextResponse.json(invoice);
  }
  // No auth required - uses Razorpay credentials
);
