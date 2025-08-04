import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { paymentOrders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { phonePeService } from '@/lib/phonepe';
import axios from 'axios';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const orderId = searchParams.get('orderId');

    if (!subscriptionId && !orderId) {
      return NextResponse.json(
        { error: 'Subscription ID or Order ID is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Find the payment order
    let whereCondition;
    if (subscriptionId) {
      whereCondition = and(
        eq(paymentOrders.providerOrderId, subscriptionId),
        eq(paymentOrders.userId, userId)
      );
    } else {
      whereCondition = and(
        eq(paymentOrders.orderId, orderId!),
        eq(paymentOrders.userId, userId)
      );
    }

    const paymentOrder = await db.query.paymentOrders.findFirst({
      where: whereCondition,
      with: {
        plan: true,
        transactions: {
          orderBy: (transactions, { desc }) => [desc(transactions.receivedAt)]
        }
      }
    });

    if (!paymentOrder) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if this is a subscription payment (has subscription metadata)
    const isSubscription = paymentOrder.metadata && 
      (paymentOrder.metadata as any).subscriptionType === true;

    let subscriptionStatus = null;
    let errorMessage = null;

    if (isSubscription && paymentOrder.providerOrderId) {
      try {
        // Get subscription status from PhonePe using the merchant subscription ID
        const statusRequest = await phonePeService.checkSubscriptionStatus(paymentOrder.providerOrderId);
        
        const response = await axios.get(statusRequest.url, {
          headers: statusRequest.headers
        });

        if (response.data) {
          subscriptionStatus = response.data;
          console.log('PhonePe subscription status response:', subscriptionStatus);

          // Update local status based on PhonePe response
          let localStatus = paymentOrder.status;
          if (subscriptionStatus.state) {
            switch (subscriptionStatus.state) {
              case 'ACTIVE':
                localStatus = 'success';
                break;
              case 'ACTIVATION_IN_PROGRESS':
                localStatus = 'pending';
                break;
              case 'FAILED':
              case 'CANCELLED':
              case 'REVOKED':
                localStatus = 'failed';
                break;
              case 'EXPIRED':
                localStatus = 'expired';
                break;
              case 'PAUSED':
                localStatus = 'paused';
                break;
            }

            // Update the payment order if status changed
            if (localStatus !== paymentOrder.status) {
              await db.update(paymentOrders)
                .set({
                  status: localStatus,
                  metadata: {
                    ...paymentOrder.metadata,
                    lastStatusCheck: new Date().toISOString(),
                    phonepeSubscriptionStatus: subscriptionStatus
                  }
                })
                .where(eq(paymentOrders.id, paymentOrder.id));
            }
          }
        }
      } catch (error) {
        console.error('Error checking PhonePe subscription status:', error);
        errorMessage = error instanceof Error ? error.message : 'Failed to check subscription status';
      }
    }

    // Return comprehensive subscription status
    return NextResponse.json({
      success: true,
      data: {
        orderId: paymentOrder.orderId,
        status: paymentOrder.status,
        amount: paymentOrder.amountMinor / 100,
        currency: paymentOrder.currency,
        planName: paymentOrder.plan?.name,
        billingCycle: paymentOrder.plan?.billingCycle,
        createdAt: paymentOrder.createdAt,
        updatedAt: paymentOrder.updatedAt,
        isSubscription: isSubscription,
        merchantSubscriptionId: paymentOrder.providerOrderId,
        subscriptionStatus: subscriptionStatus,
        phonepeStatus: {
          merchantSubscriptionId: subscriptionStatus?.merchantSubscriptionId,
          subscriptionId: subscriptionStatus?.subscriptionId,
          state: subscriptionStatus?.state,
          authWorkflowType: subscriptionStatus?.authWorkflowType,
          amountType: subscriptionStatus?.amountType,
          maxAmount: subscriptionStatus?.maxAmount,
          frequency: subscriptionStatus?.frequency,
          expireAt: subscriptionStatus?.expireAt ? new Date(subscriptionStatus.expireAt) : null,
          pauseStartDate: subscriptionStatus?.pauseStartDate ? new Date(subscriptionStatus.pauseStartDate) : null,
          pauseEndDate: subscriptionStatus?.pauseEndDate ? new Date(subscriptionStatus.pauseEndDate) : null
        },
        latestTransaction: paymentOrder.transactions[0] || null,
        error: errorMessage
      }
    });

  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}
