// app/api/subscription-plans/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import {
  users, subscriptionPlans, userSubscriptions,
  subscriptionStatuses, subscriptionRenewalTypes,
  paymentOrders, paymentTransactions,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateSubscriptionExpiryDate } from '@/lib/subscription-utils';
import { getPaymentProvider } from '@/lib/payments/gateway';
import '@/lib/payments/providers/razorpay';
import { emailService } from "@/services/email";

interface PaymentInfo {
  provider: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  [key: string]: unknown;
}


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const { planId, payment } = body as { planId: string; payment?: PaymentInfo; };
    if (!planId) return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });

    const userId = session.user.id;

    // Validate plan
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
      columns: { id: true, name: true, billingCycle: true, isActive: true, price: true },
    });
    if (!plan || !plan.isActive) return NextResponse.json({ error: 'Subscription plan not found or inactive' }, { status: 404 });

    // If payment is present, verify + persist
    if (payment?.provider) {
      const providerName = payment.provider.toLowerCase();
      const provider = getPaymentProvider(providerName);

      if (providerName === 'razorpay') {
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = payment;
        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
          return NextResponse.json({ error: 'Incomplete Razorpay payment details' }, { status: 400 });
        }

        const verified = await provider.verifyPayment({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        });
        if (!verified) return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });

        // update payment_orders
        const [updated] = await db
        .update(paymentOrders)
        .set({
          providerTransactionId: razorpayPaymentId, planId : planId || undefined,
          status: "success",
        })
        .where(eq(paymentOrders.providerOrderId, razorpayOrderId))
        .returning({ id: paymentOrders.id });

        // log success transaction
        if (!updated?.id) {
          return NextResponse.json({ error: 'Failed to update payment order' }, { status: 500 });
        }
        await db.insert(paymentTransactions).values({
          paymentOrderId: updated.id,
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
        // Fetch user email and name
        const userDetails = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { email: true, name: true },
        });
        if (userDetails?.email) {
          await emailService.sendSubscriptionPurchaseEmail(
            userDetails.email,
            userDetails.name || "",
            plan.name,
            Number(plan.price),
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
    const expiryDate = calculateSubscriptionExpiryDate(startDate, plan.billingCycle);
    const status = await db.query.subscriptionStatuses.findFirst({ where: eq(subscriptionStatuses.name, 'active'), columns: { id: true } });
    const renewalType = await db.query.subscriptionRenewalTypes.findFirst({ where: eq(subscriptionRenewalTypes.name, 'auto'), columns: { id: true } });
    if (!status?.id) return NextResponse.json({ error: 'Subscription status "active" not found' }, { status: 500 });
    if (!renewalType?.id) return NextResponse.json({ error: 'Subscription renewal type "auto" not found' }, { status: 500 });

    // Create subscription record
    await db.insert(userSubscriptions).values({
      userId,
      planId: plan.id,
      statusId: status.id,
      renewalTypeId: renewalType.id,
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan`,
      data: {
        planId: plan.id,
        planName: plan.name,
        billingCycle: plan.billingCycle,
        price: plan.price,
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    return NextResponse.json({ error: 'Failed to purchase subscription' }, { status: 500 });
  }
}
