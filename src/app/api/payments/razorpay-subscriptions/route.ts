import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { withApiHandler, errorResponse } from '@/lib/api/helpers';
import { filterSubscriptionsForUser, isAdmin } from '@/lib/api/payment-authorization';

export const runtime = "nodejs";

/**
 * GET /api/payments/razorpay-subscriptions
 * Fetch Razorpay subscriptions with optional filtering
 * 
 * @protected Requires authentication
 * @authorization Admins can see all subscriptions, users can only see their own
 * @queryparam {string} plan_id - Filter by plan ID
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

    const isAdminUser = await isAdmin(user!.id);
    console.log(`[razorpay-subscriptions] Fetching subscriptions for user: ${user?.id} (admin: ${isAdminUser})`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const subscriptions = await razorpay.subscriptions.all(options);
    
    // Filter subscriptions based on user permissions
    const filteredSubscriptions = await filterSubscriptionsForUser(
      user!.id,
      subscriptions.items as unknown as Record<string, unknown>[]
    );
    
    return NextResponse.json({ 
      success: true, 
      subscriptions: filteredSubscriptions,
      count: filteredSubscriptions.length,
      isAdmin: isAdminUser
    });
  },
  { requireAuth: true }
);
