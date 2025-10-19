import { NextResponse } from 'next/server';
import { withDynamicApiHandler, errorResponse } from '@/lib/api/helpers';

export const GET = withDynamicApiHandler<{ id?: string }>(
  async (request, { params }) => {
    const id = params?.id;
    if (!id) {
      return errorResponse('Missing payment id', 400);
    }

    const key = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key || !secret) {
      return errorResponse('Razorpay credentials not configured on server', 500);
    }

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    try {
      const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
      });

      const text = await res.text();
      // Try parse JSON, otherwise return raw text
      try {
        const data = JSON.parse(text);
        return NextResponse.json(data, { status: res.status });
      } catch {
        return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'text/plain' } });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return errorResponse(`Failed to contact Razorpay API: ${message}`, 502);
    }
  }
  // No auth required - uses Razorpay credentials
);

