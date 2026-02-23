// app/api/subscription-plans/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import {
  users, subscriptionPlans, userSubscriptions,
  subscriptionStatuses, subscriptionRenewalTypes,
  paymentOrders, paymentTransactions,
} from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { calculateSubscriptionExpiryDate } from '@/lib/utils/subscription-utils';
import { getPaymentProvider } from '@/lib/payments/gateway';
import '@/lib/payments/providers/razorpay';
import Razorpay from 'razorpay';
import { emailService } from "@/server/services/email";
import { rateLimiters } from '@/lib/middleware/rate-limit';

interface PaymentInfo {
  provider: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  [key: string]: unknown;
}

/**
 * Rate Limited: 60 requests per minute
 */
export const POST = rateLimiters.api(async (req: NextRequest): Promise<Response> => {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const { planId, payment } = body as { planId: string; payment?: PaymentInfo; };
    if (!planId) return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });

    const userId = session.user.id;

    // Validate plan
    let plan: any = null;
    // Accept local UUID plan ids or Razorpay plan ids that are prefixed with `rz-...`
    if (typeof planId === 'string' && planId.startsWith('rz-')) {
      // lookup by razorpaySubscriptionPlanId
      const rpId = planId.replace(/^rz-/, '');
      plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.razorpaySubscriptionPlanId, rpId),
        columns: { id: true, name: true, billingCycle: true, isActive: true, price: true },
      });
    } else {
      plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId),
        columns: { id: true, name: true, billingCycle: true, isActive: true, price: true },
      });
    }
    // If plan is not found locally, allow continuation when this is a Razorpay subscription flow
    // (client may have selected a Razorpay plan id like `rz-...`) and payment contains razorpaySubscriptionId
    const isRazorpaySubscriptionFlow = Boolean(payment && (payment as PaymentInfo).razorpaySubscriptionId);
    if ((!plan || !plan.isActive) && !isRazorpaySubscriptionFlow) {
      return NextResponse.json({ error: 'Subscription plan not found or inactive' }, { status: 404 });
    }

    // If payment is present, verify + persist
    // Track razorpay ids that may be set during payment verification so we can persist them on the subscription
    let razorpaySubscriptionId: string | undefined;
    let razorpayCustomerId: string | undefined;
    if (payment?.provider) {
      const providerName = payment.provider.toLowerCase();
      const provider = getPaymentProvider(providerName);

      if (providerName === 'razorpay') {
  const p = payment as PaymentInfo;
  const razorpayPaymentId = p.razorpayPaymentId;
  const razorpayOrderId = p.razorpayOrderId;
  const razorpaySignature = p.razorpaySignature;
  // assign to outer vars
  razorpaySubscriptionId = p.razorpaySubscriptionId;
  razorpayCustomerId = p.razorpayCustomerId;
        if (!razorpayPaymentId || !razorpaySignature || (!razorpayOrderId && !razorpaySubscriptionId)) {
          return NextResponse.json({ error: 'Incomplete Razorpay payment details' }, { status: 400 });
        }

        const verified = await provider.verifyPayment({
          razorpay_order_id: razorpayOrderId,
          razorpay_subscription_id: razorpaySubscriptionId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        });
        if (!verified) return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });

        // If this was an order flow, update the payment_orders table by providerOrderId
        let updatedOrderId: string | null = null;
        if (razorpayOrderId) {
          const [updated] = await db
            .update(paymentOrders)
            .set({
              providerTransactionId: razorpayPaymentId,
              planId: planId || undefined,
              status: 'success',
            })
            .where(eq(paymentOrders.providerOrderId, razorpayOrderId))
            .returning({ id: paymentOrders.id });

          if (!updated?.id) {
            return NextResponse.json({ error: 'Failed to update payment order' }, { status: 500 });
          }
          updatedOrderId = updated.id;

          await db.insert(paymentTransactions).values({
            paymentOrderId: updatedOrderId,
            provider: 'razorpay',
            event: 'payment_success',
            status: 'success',
            providerOrderId: razorpayOrderId,
            providerTransactionId: razorpayPaymentId,
            message: 'Payment successful',
            rawRequest: payment,
            rawResponse: null,
            receivedAt: new Date(),
          });
  } else if (razorpaySubscriptionId) {
          // Subscription flow: create a minimal payment_orders row so paymentTransactions can reference it
          const parsedAmount = (() => {
            try {
              const priceStr = plan?.price ?? '0';
              const num = parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
              return Math.round(num * 100);
            } catch {
              return 0;
            }
          })();

          const [createdOrder] = await db.insert(paymentOrders).values({
            userId: userId ?? undefined,
            planId: plan?.id ?? undefined,
            orderId: `rzsub-${razorpaySubscriptionId}`,
            provider: 'razorpay',
            providerOrderId: razorpaySubscriptionId,
            providerTransactionId: razorpayPaymentId,
            amountMinor: parsedAmount,
            currency: 'INR',
            status: 'success',
            razorpaySubscriptionId: razorpaySubscriptionId,
          }).returning({ id: paymentOrders.id });

          const paymentOrderIdStr = createdOrder?.id;
          if (!paymentOrderIdStr) {
            return NextResponse.json({ error: 'Failed to create payment order for subscription' }, { status: 500 });
          }

          await db.insert(paymentTransactions).values({
            paymentOrderId: paymentOrderIdStr,
            provider: 'razorpay',
            event: 'subscription_payment_success',
            status: 'success',
            providerOrderId: razorpaySubscriptionId,
            providerTransactionId: razorpayPaymentId,
            message: 'Subscription payment successful',
            rawRequest: payment,
            rawResponse: null,
            receivedAt: new Date(),
          });
        }
        // Fetch user email and name
        const userDetails = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { email: true, name: true },
        });
          if (userDetails?.email) {
            await emailService.sendSubscriptionPurchaseEmail(
              userDetails.email,
              userDetails.name || "",
              plan?.name ?? 'Razorpay plan',
              Number(plan?.price ?? 0),
              new Date()
            );
          }
      } else {
        return NextResponse.json({ error: `Unsupported payment provider: ${providerName}` }, { status: 400 });
      }
    }

    // Validate user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Compute dates + status/renewal refs
  const startDate = new Date();
  // default billingCycle if plan is missing
  const billingCycle: 'monthly' | 'yearly' = (plan?.billingCycle as 'monthly' | 'yearly') ?? 'monthly';
  const expiryDate = calculateSubscriptionExpiryDate(startDate, billingCycle);
    const status = await db.query.subscriptionStatuses.findFirst({ where: eq(subscriptionStatuses.name, 'active'), columns: { id: true } });
    const renewalType = await db.query.subscriptionRenewalTypes.findFirst({ where: eq(subscriptionRenewalTypes.name, 'auto'), columns: { id: true } });
    if (!status?.id) return NextResponse.json({ error: 'Subscription status "active" not found' }, { status: 500 });
    if (!renewalType?.id) return NextResponse.json({ error: 'Subscription renewal type "auto" not found' }, { status: 500 });

    // If we have a Razorpay subscription id, try to fetch subscription details
    let rpCreatedAt: string | undefined = undefined;
    let rpExpiryAt: string | undefined = undefined;
    let rpCustomerId: string | undefined = undefined;
    if (razorpaySubscriptionId) {
      try {
        const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
        if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
          const client = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
          const sub = await client.subscriptions.fetch(razorpaySubscriptionId);
          if (sub && typeof sub === 'object') {
            const s = sub as unknown as Record<string, unknown>;
            // Razorpay commonly returns timestamps in seconds under keys like created_at and current_end
            const createdRaw = s['created_at'] ?? s['createdAt'];
            const expiryRaw = s['current_end'] ?? s['current_end_at'] ?? s['currentEnd'];
            if (createdRaw) rpCreatedAt = new Date(Number(createdRaw) * 1000).toISOString();
            if (expiryRaw) rpExpiryAt = new Date(Number(expiryRaw) * 1000).toISOString();
            // customer id may appear under customer_id, customer or customerId
            rpCustomerId = (s['customer_id'] ?? s['customer'] ?? s['customerId']) as string | undefined;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Razorpay subscription details:', err);
      }
    }

    // Create subscription record (persist razorpay ids and dates if available)
    await db.insert(userSubscriptions).values({
      userId,
      planId: plan?.id ?? undefined,
      statusId: status.id,
      renewalTypeId: renewalType.id,
      startDate: rpCreatedAt ?? startDate.toISOString(),
      expiryDate: rpExpiryAt ?? expiryDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      razorpaySubscriptionId: razorpaySubscriptionId ?? null,
      razorpayCustomerId: rpCustomerId ?? razorpayCustomerId ?? null,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan?.name ?? 'Razorpay plan'}`,
      data: {
        planId: plan?.id ?? null,
        planName: plan?.name ?? null,
        billingCycle: billingCycle,
        price: plan?.price ?? null,
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    return NextResponse.json({ error: 'Failed to purchase subscription' }, { status: 500 });
  }
});
