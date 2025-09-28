import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: "Missing Razorpay credentials" }, { status: 500 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const count = url.searchParams.get("count");
    const skip = url.searchParams.get("skip");

  const options: Record<string, number> = {};
  if (from) options.from = Number(from);
  if (to) options.to = Number(to);
  if (count) options.count = Number(count);
  if (skip) options.skip = Number(skip);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const plans = await razorpay.plans.all(options);
    return NextResponse.json({ success: true, ...plans });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message || "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: "Missing Razorpay credentials" }, { status: 500 });
    }

    const body = await req.json();
    const { period, interval, item, notes } = body || {};

    if (!period || !interval || !item || !item.name || (item.amount == null) || !item.currency) {
      return NextResponse.json({ success: false, error: 'Missing required fields: period, interval, item.name, item.amount, item.currency' }, { status: 400 });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Create plan on Razorpay
  const payload: Record<string, unknown> = {
      period,
      interval: Number(interval),
      item: {
        name: String(item.name),
        amount: Number(item.amount),
        currency: String(item.currency),
        description: item.description ? String(item.description) : undefined,
      },
      ...(notes ? { notes } : {}),
    };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - razorpay SDK types are permissive here; payload shape validated above
  const created = await razorpay.plans.create(payload);
  return NextResponse.json(Object.assign({ success: true }, created));
  } catch (error) {
    const wrapped = error as Record<string, unknown>;
    let msg = 'Failed to create plan';
    if (wrapped && typeof wrapped === 'object' && 'error' in wrapped) {
      const errField = (wrapped as Record<string, unknown>)['error'];
      if (errField && typeof errField === 'object' && 'description' in (errField as Record<string, unknown>)) {
        msg = String((errField as Record<string, unknown>)['description']);
      }
    }
    if (!msg && error instanceof Error) msg = error.message;
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
