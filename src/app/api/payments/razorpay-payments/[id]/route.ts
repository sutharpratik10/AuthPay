import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id?: string } }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
  }

  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key || !secret) {
    return NextResponse.json({ error: 'Razorpay credentials not configured on server' }, { status: 500 });
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
      return new NextResponse(text, { status: res.status });
    }
    } catch (_err) {
      return NextResponse.json({ error: 'Failed to contact Razorpay API', details: String(_err) }, { status: 502 });
    }
}
