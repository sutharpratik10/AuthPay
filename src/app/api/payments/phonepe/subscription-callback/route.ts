import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentOrders, paymentTransactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { phonePeService } from '@/lib/phonepe';

export async function POST(req: NextRequest) {
  try {
    console.log('PhonePe Subscription Callback received');
    
    const body = await req.text();
    const xVerify = req.headers.get('X-VERIFY');
    
    console.log('Callback body:', body);
    console.log('X-VERIFY header:', xVerify);

    if (!xVerify) {
      console.error('Missing X-VERIFY header');
      return NextResponse.json(
        { error: 'Missing X-VERIFY header' },
        { status: 400 }
      );
    }

    // Verify callback signature
    const isValid = phonePeService.verifyCallback(xVerify, body);
    if (!isValid) {
      console.error('Invalid callback signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse callback data
    const callbackData = JSON.parse(Buffer.from(body, 'base64').toString());
    console.log('Decoded callback data:', callbackData);

    const { 
      merchantSubscriptionId, 
      subscriptionId, 
      merchantOrderId,
      state,
      authWorkflowType,
      amountType,
      maxAmount,
      frequency,
      expireAt
    } = callbackData;

    if (!merchantSubscriptionId && !merchantOrderId) {
      console.error('Missing merchant identifiers in callback');
      return NextResponse.json(
        { error: 'Missing merchant identifiers' },
        { status: 400 }
      );
    }

    // Find payment order by subscription ID or order ID
    const paymentOrder = await db.query.paymentOrders.findFirst({
      where: merchantSubscriptionId 
        ? eq(paymentOrders.providerOrderId, merchantSubscriptionId)
        : eq(paymentOrders.providerTransactionId, merchantOrderId),
      with: {
        plan: true
      }
    });

    if (!paymentOrder) {
      console.error('Payment order not found for subscription callback');
      return NextResponse.json(
        { error: 'Payment order not found' },
        { status: 404 }
      );
    }

    // Determine status based on subscription state
    let orderStatus = 'pending';
    switch (state) {
      case 'ACTIVE':
        orderStatus = 'success';
        break;
      case 'ACTIVATION_IN_PROGRESS':
        orderStatus = 'pending';
        break;
      case 'FAILED':
      case 'CANCELLED':
      case 'REVOKED':
        orderStatus = 'failed';
        break;
      case 'EXPIRED':
        orderStatus = 'expired';
        break;
      case 'PAUSED':
        orderStatus = 'paused';
        break;
      default:
        orderStatus = 'pending';
    }

    // Update payment order
    await db.update(paymentOrders)
      .set({
        status: orderStatus,
        metadata: {
          ...paymentOrder.metadata,
          subscriptionId: subscriptionId,
          subscriptionState: state,
          authWorkflowType: authWorkflowType,
          amountType: amountType,
          maxAmount: maxAmount,
          frequency: frequency,
          expireAt: expireAt,
          lastCallbackAt: new Date().toISOString()
        }
      })
      .where(eq(paymentOrders.id, paymentOrder.id));

    // Create transaction record
    await db.insert(paymentTransactions).values({
      paymentOrderId: paymentOrder.id,
      provider: 'phonepe',
      event: 'subscription_callback',
      status: orderStatus,
      providerOrderId: subscriptionId,
      providerTransactionId: merchantSubscriptionId || merchantOrderId,
      message: `Subscription ${state}`,
      rawRequest: null,
      rawResponse: callbackData
    });

    console.log(`Subscription callback processed: ${merchantSubscriptionId || merchantOrderId} -> ${orderStatus}`);

    return NextResponse.json({
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (error) {
    console.error('Error processing subscription callback:', error);
    return NextResponse.json(
      { error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}
