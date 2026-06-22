/**
 * GET /api/admin/subscription-plans/all
 * Fetch all subscription plans with visibility status (for admin management)
 * Combines Razorpay plan data with database settings
 * 
 * @protected Requires admin authentication
 */

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { subscriptionPlans } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import Razorpay from "razorpay";
import { withApiHandler, errorResponse } from "@/lib/api/helpers";

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

export const GET = withApiHandler(
  async (request, { user }) => {
    try {
      const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return errorResponse("Payment gateway not configured", 500);
      }

      console.log(`[API /admin/subscription-plans/all] Fetching all plans for admin ${user?.id}`);

      // Initialize Razorpay
      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET
      });

      // Fetch all Razorpay plans
      const razorpayPlansResponse = await razorpay.plans.all({ count: 100 });
      const razorpayPlans = razorpayPlansResponse.items as RazorpayPlan[];

      // Fetch all plans from database
      const dbPlans = await db.query.subscriptionPlans.findMany({
        where: eq(subscriptionPlans.isActive, true),
      });

      // Create a map of Razorpay plan ID to DB plan
      const dbPlanMap = new Map(
        dbPlans
          .filter(p => p.razorpaySubscriptionPlanId)
          .map((p: any) => [p.razorpaySubscriptionPlanId!, p])
      );

      // Combine Razorpay and DB data
      const plans = razorpayPlans.map((rp: any) => {
        const dbPlan: any = dbPlanMap.get(rp.id);

        return {
          id: rp.id,
          name: rp.item.name,
          description: rp.item.description || dbPlan?.description || "",
          amount: rp.item.amount,
          currency: rp.item.currency,
          interval: rp.interval,
          period: rp.period,
          features: dbPlan?.features ? JSON.parse(dbPlan.features) : [],
          // Visibility control
          isVisibleToCustomers: dbPlan?.isVisibleToCustomers ?? false,
          isActive: rp.item.active && (dbPlan?.isActive ?? true),
          // IDs
          razorpayPlanId: rp.id,
          razorpayItemId: rp.item.id,
          dbPlanId: dbPlan?.id,
          // Timestamps
          createdAt: rp.created_at,
          updatedAt: dbPlan?.updatedAt,
          // Metadata
          hasDbEntry: !!dbPlan,
        };
      });

      console.log(`[API /admin/subscription-plans/all] Returning ${plans.length} plans`);
      console.log(`[API /admin/subscription-plans/all] Visible: ${plans.filter(p => p.isVisibleToCustomers).length}, Hidden: ${plans.filter(p => !p.isVisibleToCustomers).length}`);

      return NextResponse.json({
        success: true,
        plans,
        count: plans.length,
        summary: {
          total: plans.length,
          visible: plans.filter(p => p.isVisibleToCustomers).length,
          hidden: plans.filter(p => !p.isVisibleToCustomers).length,
          withDbEntry: plans.filter(p => p.hasDbEntry).length,
        }
      });
    } catch (error) {
      console.error("[API /admin/subscription-plans/all] Error:", error);
      return errorResponse(
        "Failed to fetch subscription plans",
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  },
  { requireAuth: true, requireAdmin: true }
);
