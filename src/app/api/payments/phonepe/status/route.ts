import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { paymentOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find the payment order
    const paymentOrder = await db.query.paymentOrders.findFirst({
      where: eq(paymentOrders.orderId, orderId),
      with: {
        plan: true,
        transactions: {
          orderBy: (transactions, { desc }) => [desc(transactions.receivedAt)]
        }
      }
    });

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
    }    // Check payment status with PhonePe using the merchant transaction ID
    let phonePeStatus = null;
    if (paymentOrder.providerTransactionId) {
      try {
        const statusRequest = await phonePeService.checkPaymentStatus(paymentOrder.providerTransactionId);
        
        const response = await axios.get(statusRequest.url, {
          headers: statusRequest.headers
        });

        phonePeStatus = response.data;
        
        console.log('PhonePe payment status response:', phonePeStatus);
      } catch (error) {
        console.error('Error checking PhonePe payment status:', error);
        // Continue without PhonePe status if API call fails
      }
    }    return NextResponse.json({
      success: true,
      data: {
        orderId: paymentOrder.orderId,
        status: paymentOrder.status,
        amount: paymentOrder.amountMinor / 100, // Convert back to rupees
        currency: paymentOrder.currency,
        planName: paymentOrder.plan?.name,
        createdAt: paymentOrder.createdAt,
        updatedAt: paymentOrder.updatedAt,
        providerOrderId: paymentOrder.providerOrderId,
        merchantTransactionId: paymentOrder.providerTransactionId,
        phonePeStatus: phonePeStatus,
        latestTransaction: paymentOrder.transactions[0] || null
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
