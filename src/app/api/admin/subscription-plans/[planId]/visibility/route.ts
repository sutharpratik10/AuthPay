/**
 * PATCH /api/admin/subscription-plans/[planId]/visibility
 * Toggle subscription plan visibility for customers
 * Allows admins to phase out plans without deleting them
 * 
 * @protected Requires admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { subscriptionPlans } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { withDynamicApiHandler, errorResponse, successResponse } from "@/lib/api/helpers";
import Razorpay from "razorpay";

export const runtime = "nodejs";

export const PATCH = withDynamicApiHandler<{ planId: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      const planId = params.planId;
      
      if (!planId) {
        return errorResponse("Plan ID is required", 400);
      }

      const body = await request.json();
      const { isVisibleToCustomers } = body;

      if (typeof isVisibleToCustomers !== 'boolean') {
        return errorResponse("isVisibleToCustomers must be a boolean", 400);
      }

      console.log(`[API] Admin ${user?.id} toggling visibility for plan ${planId} to ${isVisibleToCustomers}`);

      // Check if planId is a UUID (database ID) or Razorpay plan ID (starts with "plan_")
      const isRazorpayPlanId = planId.startsWith('plan_');

      // Check if plan exists - search by either UUID or Razorpay plan ID
      let existingPlan = await db.query.subscriptionPlans.findFirst({
        where: isRazorpayPlanId 
          ? eq(subscriptionPlans.razorpaySubscriptionPlanId, planId)
          : eq(subscriptionPlans.id, planId),
      });

      // If Razorpay plan doesn't exist in database, create a record for it
      if (!existingPlan && isRazorpayPlanId) {
        console.log(`[API] Plan ${planId} not found in database, fetching from Razorpay and creating record`);
        
        const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
          return errorResponse("Missing Razorpay credentials", 500);
        }

        try {
          // Fetch plan details from Razorpay
          const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
          const razorpayPlan = await razorpay.plans.fetch(planId);

          // Create database record for this Razorpay plan
          const [newPlan] = await db
            .insert(subscriptionPlans)
            .values({
              name: razorpayPlan.item?.name || 'Unnamed Plan',
              description: razorpayPlan.item?.description || null,
              price: String(Number(razorpayPlan.item?.amount || razorpayPlan.item?.unit_amount || 0) / 100),
              billingCycle: razorpayPlan.period || 'monthly',
              features: null,
              isActive: true,
              isVisibleToCustomers,
              razorpaySubscriptionPlanId: planId,
            })
            .returning();

          console.log(`[API] Created database record for Razorpay plan ${planId}`);
          
          return successResponse({
            plan: newPlan,
            message: isVisibleToCustomers 
              ? "Plan is now visible to customers" 
              : "Plan is now hidden from customers (existing subscriptions not affected)"
          });
        } catch (razorpayError) {
          console.error("[API] Error fetching plan from Razorpay:", razorpayError);
          return errorResponse("Failed to fetch plan from Razorpay", 404);
        }
      }

      if (!existingPlan) {
        return errorResponse("Subscription plan not found", 404);
      }

      // Update visibility using the database UUID
      const [updatedPlan] = await db
        .update(subscriptionPlans)
        .set({ 
          isVisibleToCustomers,
          updatedAt: new Date()
        })
        .where(eq(subscriptionPlans.id, existingPlan.id))
        .returning();

      console.log(`[API] Plan ${planId} visibility updated successfully`);

      return successResponse({
        plan: updatedPlan,
        message: isVisibleToCustomers 
          ? "Plan is now visible to customers" 
          : "Plan is now hidden from customers (existing subscriptions not affected)"
      });
    } catch (error) {
      console.error("[API] Error updating plan visibility:", error);
      return errorResponse(
        "Failed to update plan visibility",
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  },
  { requireAuth: true, requireAdmin: true }
);
