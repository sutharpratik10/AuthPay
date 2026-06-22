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

      // Check if planId is a UUID (database ID) or Provider plan ID
      const isRazorpayPlanId = planId.startsWith('plan_');
      const isStripeProductId = planId.startsWith('prod_');

      // Check if plan exists - search by either UUID or Provider plan ID
      let existingPlan = await db.query.subscriptionPlans.findFirst({
        where: isRazorpayPlanId 
          ? eq(subscriptionPlans.razorpaySubscriptionPlanId, planId)
          : isStripeProductId
          ? eq(subscriptionPlans.stripeProductId, planId)
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

          existingPlan = newPlan;
        } catch (razorpayError) {
          console.error("[API] Error fetching plan from Razorpay:", razorpayError);
          return errorResponse("Failed to fetch plan from Razorpay", 404);
        }
      }

      // If Stripe product doesn't exist in database, create a record for it
      if (!existingPlan && isStripeProductId) {
        console.log(`[API] Plan ${planId} not found in database, fetching from Stripe and creating record`);
        
        const { STRIPE_SECRET_KEY } = process.env;
        if (!STRIPE_SECRET_KEY) {
          return errorResponse("Missing Stripe credentials", 500);
        }

        try {
          const Stripe = (await import('stripe')).default;
          const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" as any });
          const stripeProduct = await stripe.products.retrieve(planId);
          
          let priceAmt = 0;
          let priceId: string | null = null;
          let interval = 'monthly';
          
          if (stripeProduct.default_price) {
             const defaultPriceId = typeof stripeProduct.default_price === 'string' 
                ? stripeProduct.default_price 
                : stripeProduct.default_price.id;
             priceId = defaultPriceId;
             try {
               const priceObj = await stripe.prices.retrieve(defaultPriceId);
               priceAmt = (priceObj.unit_amount || 0) / 100;
               interval = priceObj.recurring?.interval === 'year' ? 'yearly' 
                          : (priceObj.recurring?.interval || 'monthly');
             } catch (e) {
               console.error("Failed to retrieve price context for Stripe product", e);
             }
          }

          const [newPlan] = await db
            .insert(subscriptionPlans)
            .values({
              name: stripeProduct.name || 'Unnamed Plan',
              description: stripeProduct.description || null,
              price: String(priceAmt),
              billingCycle: interval,
              features: null,
              isActive: true,
              isVisibleToCustomers,
              stripeProductId: planId,
              stripePriceId: priceId,
            })
            .returning();

          existingPlan = newPlan;
        } catch (stripeError) {
          console.error("[API] Error fetching plan from Stripe:", stripeError);
          return errorResponse("Failed to fetch plan from Stripe", 404);
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
