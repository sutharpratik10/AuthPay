import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { withApiHandler, errorResponse, validateRequiredFields } from '@/lib/api/helpers';

export const runtime = "nodejs";

/**
 * GET /api/payments/razorpay-plans
 * Fetch all Razorpay plans with optional filtering
 * 
 * @protected Requires authentication
 * @queryparam {number} from - Unix timestamp to filter from
 * @queryparam {number} to - Unix timestamp to filter to
 * @queryparam {number} count - Number of items to return
 * @queryparam {number} skip - Number of items to skip
 */
export const GET = withApiHandler(
  async (request, { user }) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return errorResponse("Missing Razorpay credentials", 500);
    }

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const count = url.searchParams.get("count");
    const skip = url.searchParams.get("skip");

    const options: Record<string, number> = {};
    if (from) options.from = Number(from);
    if (to) options.to = Number(to);
    if (count) options.count = Number(count);
    if (skip) options.skip = Number(skip);

    console.log(`[razorpay-plans] Fetching plans for user: ${user?.id}`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const plans = await razorpay.plans.all(options);
    
    return NextResponse.json({ success: true, ...plans });
  },
  { requireAuth: true }
);

/**
 * POST /api/payments/razorpay-plans
 * Create a new Razorpay plan
 * 
 * @protected Requires admin authentication
 * @body {string} period - Billing period (daily, weekly, monthly, yearly)
 * @body {number} interval - Billing interval
 * @body {object} item - Plan item details (name, amount, currency, description)
 * @body {object} notes - Optional metadata
 */
export const POST = withApiHandler(
  async (request, { user }) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return errorResponse("Missing Razorpay credentials", 500);
    }

    const body = await request.json();
    const { period, interval, item, notes } = body || {};

    // Validate required fields
    const validation = validateRequiredFields(body, ['period', 'interval', 'item']);
    if (!validation.valid) {
      return validation.error!;
    }

    if (!item.name || (item.amount == null) || !item.currency) {
      return errorResponse('Missing required item fields: name, amount, currency', 400);
    }

    console.log(`[razorpay-plans] Creating plan by admin user: ${user?.id}`);

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
  },
  { 
    requireAuth: true,
    requireAdmin: true // Only admins can create plans
  }
);
