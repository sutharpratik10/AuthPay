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
    const plan_id = url.searchParams.get("plan_id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const count = url.searchParams.get("count");
    const skip = url.searchParams.get("skip");

    const options: Record<string, string | number> = {};
    if (plan_id) options.plan_id = plan_id;
    if (from) options.from = Number(from);
    if (to) options.to = Number(to);
    if (count) options.count = Number(count);
    if (skip) options.skip = Number(skip);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const subscriptions = await razorpay.subscriptions.all(options);
    
    return NextResponse.json({ 
      success: true, 
      subscriptions: subscriptions.items,
      count: subscriptions.count 
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message || "Failed to fetch subscriptions" 
    }, { status: 500 });
  }
}
