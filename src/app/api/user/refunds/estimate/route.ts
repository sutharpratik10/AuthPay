import { NextRequest, NextResponse } from "next/server";
import { withPolicy } from "@/lib/api/permissions";
import { API_POLICIES } from "@/lib/api/permissions";
import Razorpay from "razorpay";

export const GET = withPolicy(async (req: NextRequest) => {
  try {
    const { auth } = await import("@/config/auth");
    const session = await auth();
    const userId = session!.user!.id!;

    const providerSubscriptionId = req.nextUrl.searchParams.get("providerSubscriptionId");
    if (!providerSubscriptionId) {
      return NextResponse.json({ error: "providerSubscriptionId is required" }, { status: 400 });
    }

    const { db } = await import("@/server/db");
    const { paymentOrders, userSubscriptions } = await import("@/server/db/schema");
    const { eq, and, desc } = await import("drizzle-orm");

    // Find the subscription first, and join the payment order via the FK
    const subscription = await db.query.userSubscriptions.findFirst({
      where: and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.providerSubscriptionId, providerSubscriptionId)
      ),
      with: {
        paymentOrder: {
          with: { plan: true }
        }
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const order = subscription.paymentOrder;
    if (!order || order.status !== 'success') {
      return NextResponse.json({ error: "No successful payment order linked to this subscription" }, { status: 404 });
    }

    const startDate = new Date(subscription.startDate);
    let expiryDate = subscription.expiryDate ? new Date(subscription.expiryDate) : null;

    let totalPlanCostMinor = order.amountMinor;

    // Fix for Razorpay setup orders which have 0 amount
    if (totalPlanCostMinor === 0 && order.provider === 'razorpay' && providerSubscriptionId) {
      try {
        const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
        const sub = await razorpay.subscriptions.fetch(providerSubscriptionId);
        if (sub && (sub as any).plan_id) {
          const plan = await razorpay.plans.fetch((sub as any).plan_id);
          if (plan && (plan.item as any)?.amount) {
            totalPlanCostMinor = Number((plan.item as any).amount);
          } else if (plan && (plan as any).amount) {
            totalPlanCostMinor = Number((plan as any).amount);
          }
        }
      } catch (err) {
        console.error('Failed to fetch Razorpay plan amount:', err);
      }
    }

    // If no expiry date (e.g. lifetime plan), refund full amount or handle differently
    if (!expiryDate) {
      return NextResponse.json({
        success: true,
        estimate: {
          totalPlanCostMinor: totalPlanCostMinor,
          currency: order.currency,
          durationMinutes: 0,
          timeUsedMinutes: 0,
          unusedTimeMinutes: 0,
          refundAmountMinor: totalPlanCostMinor, // full refund for lifetime if they request it
          isLifetime: true,
        }
      });
    }

    const now = new Date();
    const durationMs = expiryDate.getTime() - startDate.getTime();
    const durationMinutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));

    const usedMs = now.getTime() - startDate.getTime();
    const timeUsedMinutes = Math.max(0, Math.floor(usedMs / (1000 * 60)));

    const unusedMs = expiryDate.getTime() - now.getTime();
    const unusedTimeMinutes = Math.max(0, Math.floor(unusedMs / (1000 * 60)));

    let refundAmountMinor = 0;
    if (durationMinutes > 0 && unusedTimeMinutes > 0) {
      refundAmountMinor = Math.floor((unusedTimeMinutes / durationMinutes) * totalPlanCostMinor);
    }

    return NextResponse.json({
      success: true,
      estimate: {
        totalPlanCostMinor: totalPlanCostMinor,
        currency: order.currency,
        durationMinutes,
        timeUsedMinutes,
        unusedTimeMinutes,
        refundAmountMinor,
        isLifetime: false,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}, API_POLICIES.USER_ACCESS);
