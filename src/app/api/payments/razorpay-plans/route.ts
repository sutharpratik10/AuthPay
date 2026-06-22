import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { withApiHandler, errorResponse, validateRequiredFields } from '@/lib/api/helpers';
import { db } from "@/server/db";
import { subscriptionPlans } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";

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

    // Fetch visibility data from database for all Razorpay plans
    const razorpayPlanIds = plans.items.map((p: { id: string }) => p.id);
    const dbPlans = await db
      .select({
        razorpaySubscriptionPlanId: subscriptionPlans.razorpaySubscriptionPlanId,
        isVisibleToCustomers: subscriptionPlans.isVisibleToCustomers,
      })
      .from(subscriptionPlans)
      .where(inArray(subscriptionPlans.razorpaySubscriptionPlanId, razorpayPlanIds));

    // Create a map of Razorpay plan ID to visibility status
    const visibilityMap = new Map(
      dbPlans.map(p => [p.razorpaySubscriptionPlanId, p.isVisibleToCustomers])
    );

    // Merge visibility data into Razorpay plans
    const plansWithVisibility = plans.items.map((plan: { id: string }) => ({
      ...plan,
      isVisibleToCustomers: visibilityMap.get(plan.id) ?? true, // Default to true if not in database
    }));

    return NextResponse.json({
      success: true,
      ...plans,
      items: plansWithVisibility
    });
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
    const { period, interval, item, notes, features } = body || {};

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

    // Create plan on Razorpay (don't include features - Razorpay doesn't support them)
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
    const created = await razorpay.plans.create(payload) as { id: string } & Record<string, unknown>;

    // Create corresponding database record with features
    try {
      // Format price for database (convert from paise to rupees)
      const priceFormatted = `₹${(Number(item.amount) / 100).toFixed(2)}`;

      await db.insert(subscriptionPlans).values({
        name: String(item.name),
        description: item.description ? String(item.description) : null,
        price: priceFormatted,
        billingCycle: String(period),
        features: features && Array.isArray(features) && features.length > 0
          ? JSON.stringify(features)
          : null,
        isActive: true,
        isVisibleToCustomers: true,
        razorpaySubscriptionPlanId: created.id,
        razorpaySubscriptionId: null,
        razorpaySubscriptionLink: null,
      });

      console.log(`[razorpay-plans] Created database record for plan: ${created.id}`);
    } catch (dbError) {
      console.error('[razorpay-plans] Failed to create database record:', dbError);
      // Plan was still created in Razorpay, so we return success but log the error
    }

    return NextResponse.json(Object.assign({ success: true }, created));
  },
  {
    requireAuth: true,
    requireAdmin: true // Only admins can create plans
  }
);
