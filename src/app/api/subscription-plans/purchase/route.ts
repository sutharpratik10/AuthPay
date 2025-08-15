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
    console.log('Starting subscription purchase process');
    
    const session = await auth();
    if (!session?.user?.id) {
      console.log('Authentication failed - no session or user ID');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { planId, payment } = body as { planId: string; payment?: PaymentInfo; };
    if (!planId) {
      console.log('Missing planId in request');
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const userId = session.user.id;
    console.log('Processing for userId:', userId, 'planId:', planId);

    // Validate plan
    console.log('Fetching subscription plan...');
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
      columns: { id: true, name: true, billingCycle: true, isActive: true, price: true },
    });
    
    if (!plan || !plan.isActive) {
      console.log('Plan not found or inactive:', plan);
      return NextResponse.json({ error: 'Subscription plan not found or inactive' }, { status: 404 });
    }
    console.log('Plan validated:', plan);

    // If payment is present, verify + persist
    if (payment?.provider) {
      console.log('Processing payment with provider:', payment.provider);
      
      const providerName = payment.provider.toLowerCase();
      const provider = getPaymentProvider(providerName);

      if (providerName === 'razorpay') {
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = payment;
        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
          console.log('Incomplete Razorpay payment details');
          return NextResponse.json({ error: 'Incomplete Razorpay payment details' }, { status: 400 });
        }

        console.log('Verifying Razorpay payment...');
        const verified = await provider.verifyPayment({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        });
        
        if (!verified) {
          console.log('Payment verification failed');
          return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

        console.log('Payment verified, updating payment order...');
        // Update payment_orders
        const [updated] = await db
          .update(paymentOrders)
          .set({
            providerTransactionId: razorpayPaymentId,
            planId: planId || undefined,
            status: "success",
            updatedAt: new Date(), // Use Date object, not ISO string
          })
          .where(eq(paymentOrders.providerOrderId, razorpayOrderId))
          .returning({ id: paymentOrders.id });

        if (!updated?.id) {
          console.log('Failed to update payment order');
          return NextResponse.json({ error: 'Failed to update payment order' }, { status: 500 });
        }

        console.log('Payment order updated, logging transaction...');
        // Log success transaction
        await db.insert(paymentTransactions).values({
          paymentOrderId: updated.id,
          provider: 'razorpay',
          event: 'payment_success',
          status: 'success',
          providerOrderId: razorpayOrderId,
          providerTransactionId: razorpayPaymentId,
          message: 'Payment successful',
          rawRequest: JSON.stringify(payment), // Ensure it's serialized
          rawResponse: null,
          receivedAt: new Date(), // Use Date object
          createdAt: new Date(), // Use Date object if your schema requires it
        });

        // Fetch user email and name
        console.log('Fetching user details for email...');
        const userDetails = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { email: true, name: true },
        });
        
        if (userDetails?.email) {
          console.log('Sending subscription purchase email...');
          try {
            await emailService.sendSubscriptionPurchaseEmail(
              userDetails.email,
              userDetails.name || "",
              plan.name,
              Number(plan.price),
              new Date()
            );
            console.log('Email sent successfully');
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the entire request if email fails
          }
        }
      } else {
        console.log('Unsupported payment provider:', providerName);
        return NextResponse.json({ error: `Unsupported payment provider: ${providerName}` }, { status: 400 });
      }
    }

    // Validate user
    console.log('Validating user exists...');
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true },
    });
    
    if (!user) {
      console.log('User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Compute dates + status/renewal refs
    console.log('Computing subscription dates...');
    const startDate = new Date();
    const expiryDate = calculateSubscriptionExpiryDate(startDate, plan.billingCycle);
    
    console.log('Fetching subscription status and renewal type...');
    const status = await db.query.subscriptionStatuses.findFirst({ 
      where: eq(subscriptionStatuses.name, 'active'), 
      columns: { id: true } 
    });
    const renewalType = await db.query.subscriptionRenewalTypes.findFirst({ 
      where: eq(subscriptionRenewalTypes.name, 'auto'), 
      columns: { id: true } 
    });
    
    if (!status?.id) {
      console.log('Subscription status "active" not found');
      return NextResponse.json({ error: 'Subscription status "active" not found' }, { status: 500 });
    }
    if (!renewalType?.id) {
      console.log('Subscription renewal type "auto" not found');
      return NextResponse.json({ error: 'Subscription renewal type "auto" not found' }, { status: 500 });
    }

    // Check for existing active subscription
    console.log('Checking for existing active subscription...');
    const existingSubscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
      columns: { id: true, statusId: true, expiryDate: true },
    });

    if (existingSubscription && existingSubscription.statusId === status.id) {
      const expiryDateObj = new Date(existingSubscription.expiryDate);
      if (expiryDateObj > new Date()) {
        console.log('User already has an active subscription');
        return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 });
      }
    }

    // Create subscription record
    console.log('Creating subscription record...');
    const [subscription] = await db.insert(userSubscriptions).values({
      userId,
      planId: plan.id,
      statusId: status.id,
      renewalTypeId: renewalType.id,
      startDate: startDate, // Use Date object
      expiryDate: expiryDate, // Use Date object
      createdAt: new Date(), // Use Date object
      updatedAt: new Date(), // Use Date object
    }).returning({ id: userSubscriptions.id });

    console.log('Subscription created successfully:', subscription);

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan`,
      data: {
        subscriptionId: subscription?.id,
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return more specific error information in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json({ 
      error: 'Failed to purchase subscription',
      ...(isDevelopment && { 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    }, { status: 500 });
  }
}