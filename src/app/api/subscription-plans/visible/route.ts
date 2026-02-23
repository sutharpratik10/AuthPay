/**
 * GET /api/subscription-plans/visible
 * Fetch visible subscription plans for customers
 * Combines Razorpay plan data with database visibility settings
 * 
 * @public No authentication required (for pricing page)
 */

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { subscriptionPlans, userSubscriptions } from "@/server/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import Razorpay from "razorpay";

export const runtime = "nodejs";

interface RazorpayPlan {
  id: string;
  entity: string;
  interval: number;
  period: string;
  item: {
    id: string;
    active: boolean;
    name: string;
    description: string | null;
    amount: number;
    unit_amount: number;
    currency: string;
    type: string;
    unit: string | null;
    tax_inclusive: boolean;
    hsn_code: string | null;
    sac_code: string | null;
    tax_rate: number | null;
    tax_id: string | null;
    tax_group_id: string | null;
    created_at: number;
  };
  notes: Record<string, string>;
  created_at: number;
}

export async function GET() {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });

    // Fetch all active Razorpay plans
    const razorpayPlansResponse = await razorpay.plans.all({ count: 100 });
    const razorpayPlans = razorpayPlansResponse.items as RazorpayPlan[];

    console.log(`[API /api/subscription-plans/visible] Fetched ${razorpayPlans.length} plans from Razorpay`);

    // Fetch all plans from database with visibility settings
    const dbPlans = await db.query.subscriptionPlans.findMany({
      where: and(
        eq(subscriptionPlans.isActive, true),
        eq(subscriptionPlans.isVisibleToCustomers, true)
      ),
    });

    // Calculate plan popularity
    const popularityStats = await db
      .select({
        planId: userSubscriptions.planId,
        count: count(userSubscriptions.id),
      })
      .from(userSubscriptions)
      .groupBy(userSubscriptions.planId);

    const popularityMap = new Map(popularityStats.map((s: any) => [s.planId, Number(s.count)]));
    const maxPopularity = Math.max(...Array.from(popularityMap.values()) as number[], 0);

    console.log(`[API /api/subscription-plans/visible] Found ${dbPlans.length} visible plans in database`);

    // Map Razorpay plans to our format, filtering by visibility
    const visibleRazorpayPlanIds = new Set(
      dbPlans
        .filter(p => p.razorpaySubscriptionPlanId)
        .map(p => p.razorpaySubscriptionPlanId)
    );

    // Get Razorpay subscription plans that are visible
    const razorpayVisiblePlans = razorpayPlans
      .filter(rp => visibleRazorpayPlanIds.has(rp.id))
      .map(rp => {
        const dbPlan = dbPlans.find(p => p.razorpaySubscriptionPlanId === rp.id);

        return {
          id: rp.id,
          name: rp.item.name,
          description: rp.item.description || dbPlan?.description || "",
          amount: rp.item.amount,
          currency: rp.item.currency,
          interval: rp.interval,
          period: rp.period,
          features: dbPlan?.features ? JSON.parse(dbPlan.features) : [],
          // Razorpay metadata
          razorpayPlanId: rp.id,
          razorpayItemId: rp.item.id,
          // Database metadata
          dbPlanId: dbPlan?.id,
          isActive: rp.item.active && (dbPlan?.isActive ?? true),
          createdAt: rp.created_at,
          displayOrder: dbPlan?.displayOrder ?? 0,
          badge: (dbPlan?.enableAutoPopular && (popularityMap.get(dbPlan.id) || 0) === maxPopularity && maxPopularity > 0)
            ? "Most Popular"
            : (dbPlan?.badgeText || null),
          // Plan type
          planType: 'subscription' as const,
        };
      });

    // Get Basic Plans (one-time payment plans without Razorpay link)
    const basicPlans = dbPlans
      .filter(p => !p.razorpaySubscriptionPlanId)
      .map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        // Convert price string to amount in smallest currency unit (paise/cents)
        amount: Math.round(parseFloat(p.price.replace(/[^0-9.]/g, '')) * 100),
        currency: 'INR', // Default currency - could be enhanced to read from plan
        interval: 1,
        period: p.billingCycle || 'one-time',
        features: p.features ? JSON.parse(p.features) : [],
        // No Razorpay metadata for basic plans
        razorpayPlanId: null,
        razorpayItemId: null,
        // Database metadata
        dbPlanId: p.id,
        isActive: p.isActive,
        createdAt: new Date(p.createdAt).getTime() / 1000,

        displayOrder: p.displayOrder ?? 0,
        badge: (p.enableAutoPopular && (popularityMap.get(p.id) || 0) === maxPopularity && maxPopularity > 0)
          ? "Most Popular"
          : (p.badgeText || null),
        // Plan type
        planType: 'basic' as const,
      }));

    // Combine both plan types and sort by displayOrder
    const plans = [...razorpayVisiblePlans, ...basicPlans].sort((a, b) => {
      return (a.displayOrder - b.displayOrder);
    });

    console.log(`[API /api/subscription-plans/visible] Returning ${razorpayVisiblePlans.length} Razorpay plans and ${basicPlans.length} Basic plans to customer`);

    return NextResponse.json({
      success: true,
      plans,
      count: plans.length,
    });
  } catch (error) {
    console.error("[API /api/subscription-plans/visible] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch subscription plans",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
