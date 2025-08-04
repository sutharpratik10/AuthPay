import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { paymentOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { phonePeService, PhonePeException } from '@/lib/phonepe';
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
    const orderId = searchParams.get('orderId');
    const subscriptionId = searchParams.get('subscriptionId');

    if (!orderId && !subscriptionId) {
      return NextResponse.json(
        { error: 'Order ID or Subscription ID is required' },
        { status: 400 }
      );
    }

    // Find the payment order
    let paymentOrder;
    if (orderId) {
      paymentOrder = await db.query.paymentOrders.findFirst({
        where: eq(paymentOrders.orderId, orderId),
        with: {
          plan: true,
          transactions: {
            orderBy: (transactions, { desc }) => [desc(transactions.receivedAt)]
          }
        }
      });
    } else if (subscriptionId) {
      paymentOrder = await db.query.paymentOrders.findFirst({
        where: eq(paymentOrders.providerOrderId, subscriptionId),
        with: {
          plan: true,
          transactions: {
            orderBy: (transactions, { desc }) => [desc(transactions.receivedAt)]
          }
        }
      });
    }

    if (!paymentOrder) {
      return NextResponse.json(
        { error: 'Payment order not found' },
        { status: 404 }
      );
    }

    // Check if the order belongs to the authenticated user
    if (paymentOrder.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to payment order' },
        { status: 403 }
      );
    }

    // Determine if this is a subscription or standard payment
    const isSubscription = paymentOrder.purpose === 'subscription_setup' || 
                          paymentOrder.purpose === 'subscription';

    let phonePeStatus = null;
    let statusError = null;

    // Check payment/subscription status with PhonePe
    if (paymentOrder.providerTransactionId) {
      try {
        if (isSubscription && paymentOrder.purpose === 'subscription_setup') {
          // Use subscription status API
          const statusRequest = await phonePeService.checkSubscriptionStatus(paymentOrder.providerTransactionId);
          
          const response = await axios.get(statusRequest.url, {
            headers: statusRequest.headers
          });

          phonePeStatus = response.data;
          
          console.log('PhonePe subscription status response:', phonePeStatus);
        } else {
          // Use standard payment status API
          const statusRequest = await phonePeService.checkPaymentStatus(paymentOrder.providerTransactionId);
          
          const response = await axios.get(statusRequest.url, {
            headers: statusRequest.headers
          });

          phonePeStatus = response.data;
          
          console.log('PhonePe payment status response:', phonePeStatus);
        }
      } catch (error) {
        console.error('Error checking PhonePe status:', error);
        
        if (error instanceof PhonePeException) {
          statusError = {
            message: error.message,
            code: error.code,
            httpStatus: error.httpStatusCode
          };
        } else {
          statusError = {
            message: 'Network error while checking status',
            code: 'NETWORK_ERROR'
          };
        }
      }
    }

    // Enhanced response with proper status mapping
    let mappedStatus = paymentOrder.status;
    if (phonePeStatus) {
      // Map PhonePe status to our internal status
      if (isSubscription) {
        // Subscription status mapping
        switch (phonePeStatus.state) {
          case 'ACTIVE':
            mappedStatus = 'success';
            break;
          case 'ACTIVATION_IN_PROGRESS':
            mappedStatus = 'pending';
            break;
          case 'FAILED':
          case 'CANCELLED':
          case 'REVOKED':
            mappedStatus = 'failed';
            break;
          case 'PAUSED':
            mappedStatus = 'paused';
            break;
          default:
            mappedStatus = 'pending';
        }
      } else {
        // Standard payment status mapping
        switch (phonePeStatus.state) {
          case 'COMPLETED':
            mappedStatus = 'success';
            break;
          case 'PENDING':
            mappedStatus = 'pending';
            break;
          case 'FAILED':
            mappedStatus = 'failed';
            break;
          default:
            mappedStatus = 'pending';
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: paymentOrder.orderId,
        status: mappedStatus,
        originalStatus: paymentOrder.status,
        amount: paymentOrder.amountMinor / 100, // Convert back to rupees
        currency: paymentOrder.currency,
        planName: paymentOrder.plan?.name,
        createdAt: paymentOrder.createdAt,
        updatedAt: paymentOrder.updatedAt,
        providerOrderId: paymentOrder.providerOrderId,
        merchantTransactionId: paymentOrder.providerTransactionId,
        isSubscription: isSubscription,
        purpose: paymentOrder.purpose,
        phonePeStatus: phonePeStatus,
        statusError: statusError,
        latestTransaction: paymentOrder.transactions[0] || null
      }
    });

  } catch (error) {
    console.error('Error checking payment/subscription status:', error);
    
    if (error instanceof PhonePeException) {
      return NextResponse.json(
        { 
          error: 'PhonePe API error',
          details: error.message,
          code: error.code
        },
        { status: error.httpStatusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
