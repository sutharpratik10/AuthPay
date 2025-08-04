import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentOrders, paymentTransactions, tenants, tenantUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { phonePeService, PhonePeException } from '@/lib/phonepe';
import { calculateSubscriptionExpiryDate } from '@/lib/subscription-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const xVerify = req.headers.get('X-VERIFY') || '';
    const authorization = req.headers.get('Authorization') || '';
    
    console.log('Received PhonePe callback:', {
      bodyLength: body.length,
      hasXVerify: !!xVerify,
      hasAuthorization: !!authorization
    });

    let callbackData: any;
    let isSubscriptionCallback = false;

    // Check if it's a subscription callback (has Authorization header) or standard payment callback
    if (authorization) {
      // Subscription callback - validate using callback validation method
      try {
        // For subscription callbacks, we need to parse the response differently
        callbackData = JSON.parse(body);
        isSubscriptionCallback = true;
        
        // Subscription callbacks might use different validation
        console.log('Processing subscription callback:', callbackData);
      } catch (error) {
        console.error('Failed to parse subscription callback:', error);
        return NextResponse.json(
          { error: 'Invalid subscription callback format' },
          { status: 400 }
        );
      }
    } else {
      // Standard payment callback - verify signature
      try {
        if (!phonePeService.verifyCallback(xVerify, body)) {
          console.error('Invalid PhonePe callback signature');
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
          );
        }

        callbackData = JSON.parse(Buffer.from(body, 'base64').toString());
        console.log('Processing standard payment callback:', callbackData);
      } catch (error) {
        console.error('Failed to parse payment callback:', error);
        return NextResponse.json(
          { error: 'Invalid payment callback format' },
          { status: 400 }
        );
      }
    }

    // Extract relevant data based on callback type
    let orderId: string;
    let transactionId: string;
    let status: string;
    let message: string;
    let providerReferenceId: string;

    if (isSubscriptionCallback) {
      // Handle subscription callback structure
      orderId = callbackData.merchantOrderId || callbackData.orderId;
      transactionId = callbackData.subscriptionId || callbackData.merchantSubscriptionId;
      status = callbackData.state || callbackData.status;
      message = callbackData.message || '';
      providerReferenceId = callbackData.subscriptionId || '';
    } else {
      // Handle standard payment callback structure
      const payload = callbackData.payload || callbackData;
      orderId = payload.merchantOrderId || payload.orderId;
      transactionId = payload.transactionId || payload.merchantTransactionId;
      status = payload.state || payload.status;
      message = payload.message || '';
      providerReferenceId = payload.providerReferenceId || '';
    }

    if (!orderId) {
      console.error('No order ID found in callback data');
      return NextResponse.json(
        { error: 'Order ID not found in callback' },
        { status: 400 }
      );
    }    // Find the payment order by order ID or provider order ID
    let paymentOrder = await db.query.paymentOrders.findFirst({
      where: eq(paymentOrders.orderId, orderId),
      with: {
        plan: true,
        user: true
      }
    });

    // If not found by orderId, try to find by provider order ID
    if (!paymentOrder && (transactionId || providerReferenceId)) {
      paymentOrder = await db.query.paymentOrders.findFirst({
        where: eq(paymentOrders.providerOrderId, transactionId || providerReferenceId),
        with: {
          plan: true,
          user: true
        }
      });
    }

    if (!paymentOrder) {
      console.error('Payment order not found for:', { orderId, transactionId, providerReferenceId });
      return NextResponse.json(
        { error: 'Payment order not found' },
        { status: 404 }
      );
    }

    console.log('Found payment order:', {
      id: paymentOrder.id,
      orderId: paymentOrder.orderId,
      currentStatus: paymentOrder.status,
      purpose: paymentOrder.purpose
    });    // Create payment transaction record
    try {
      await db.insert(paymentTransactions).values({
        paymentOrderId: paymentOrder.id,
        provider: 'phonepe',
        event: isSubscriptionCallback ? 'subscription_callback' : 'payment_callback',
        status: status?.toLowerCase() || 'unknown',
        providerOrderId: orderId,
        providerTransactionId: transactionId || providerReferenceId,
        message: message || '',
        rawRequest: { 
          body: callbackData, 
          isSubscriptionCallback,
          headers: {
            xVerify: xVerify || null,
            authorization: authorization || null
          }
        },
        rawResponse: { 
          xVerify, 
          authorization,
          timestamp: new Date().toISOString() 
        }
      });
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      // Continue processing even if transaction logging fails
    }// Update payment order status
    let newStatus = 'failed';
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      newStatus = 'success';
    } else if (status === 'PENDING') {
      newStatus = 'pending';
    }

    await db.update(paymentOrders)
      .set({
        status: newStatus,
        providerTransactionId: transactionId || providerReferenceId,
        updatedAt: new Date()
      })
      .where(eq(paymentOrders.id, paymentOrder.id));

    // If payment is successful, activate the subscription
    if (newStatus === 'success' && paymentOrder.plan && paymentOrder.user) {
      try {
        // Check if user already has a tenant
        const existingTenant = await db.query.tenantUsers.findFirst({
          where: eq(tenantUsers.userId, paymentOrder.userId!),
          with: {
            tenant: true
          }
        });

        const effectiveDate = new Date();
        const expiryDate = calculateSubscriptionExpiryDate(effectiveDate, paymentOrder.plan.billingCycle);

        if (!existingTenant) {
          // Create a new tenant for this user
          const shortUserId = paymentOrder.userId!.substring(0, 8);
          const timestamp = Date.now().toString().slice(-8);
          const slug = `user-${shortUserId}-${timestamp}`;
          
          const tenantName = `${paymentOrder.user.name || paymentOrder.user.email}'s Workspace`;
          const truncatedName = tenantName.length > 255 ? tenantName.substring(0, 252) + '...' : tenantName;
          
          const newTenant = await db.insert(tenants).values({
            name: truncatedName,
            slug: slug,
            planId: paymentOrder.planId!,
            planEffectiveDate: effectiveDate,
            planExpiryDate: expiryDate,
            isActive: true
          }).returning();

          // Associate the user with their new tenant
          await db.insert(tenantUsers).values({
            tenantId: newTenant[0].id,
            userId: paymentOrder.userId!,
            isOwner: true,
            isPrimary: true,
            status: 'active',
            joinedAt: new Date()
          });

        } else {
          // Update existing tenant's subscription plan
          await db.update(tenants)
            .set({
              planId: paymentOrder.planId!,
              planEffectiveDate: effectiveDate,
              planExpiryDate: expiryDate,
              updatedAt: new Date()
            })
            .where(eq(tenants.id, existingTenant.tenant.id));
        }

        console.log('Subscription activated for user:', paymentOrder.userId);
      } catch (error) {
        console.error('Error activating subscription:', error);
        // Don't fail the callback, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: 'Callback processed successfully'
    });

  } catch (error) {
    console.error('Error processing PhonePe callback:', error);
    return NextResponse.json(
      { error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}

// Handle GET requests for status checks
export async function GET() {
  return NextResponse.json({
    message: 'PhonePe callback endpoint is active',
    timestamp: new Date().toISOString()
  });
}
