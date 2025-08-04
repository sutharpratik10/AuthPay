import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, subscriptionPlans, paymentOrders, tenants, tenantUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { phonePeService, PhonePeException } from '@/lib/phonepe';
import { calculateSubscriptionExpiryDate } from '@/lib/subscription-utils';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { planId, mobileNumber, paymentType = 'standard' } = await req.json();

    if (!planId || !mobileNumber) {
      return NextResponse.json(
        { error: 'Plan ID and mobile number are required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get subscription plan
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
      columns: { 
        id: true, 
        name: true, 
        price: true, 
        billingCycle: true,
        features: true,
        isActive: true 
      }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Subscription plan not found or inactive' },
        { status: 404 }
      );
    }

    // Parse price (remove currency symbols and convert to number)
    const priceNumber = parseFloat(plan.price.replace(/[^0-9.]/g, ''));
    
    if (isNaN(priceNumber) || priceNumber <= 0) {
      return NextResponse.json(
        { error: 'Invalid plan price' },
        { status: 400 }
      );
    }

    // Find or create tenant for the user
    let tenantId: string;
    
    // Check if user already has a tenant
    const existingTenant = await db.query.tenantUsers.findFirst({
      where: eq(tenantUsers.userId, userId),
      with: {
        tenant: true
      }
    });

    if (existingTenant?.tenant) {
      // User already has a tenant
      tenantId = existingTenant.tenant.id;
    } else {
      // Create a new tenant for this user
      const shortUserId = userId.substring(0, 8);
      const timestamp = Date.now().toString().slice(-8);
      const slug = `user-${shortUserId}-${timestamp}`;
      
      const tenantName = `${user.name || user.email}'s Workspace`;
      const truncatedName = tenantName.length > 255 ? tenantName.substring(0, 252) + '...' : tenantName;
      
      const effectiveDate = new Date();
      const expiryDate = calculateSubscriptionExpiryDate(effectiveDate, plan.billingCycle);
      
      const newTenant = await db.insert(tenants).values({
        name: truncatedName,
        slug: slug,
        planId: planId,
        planEffectiveDate: effectiveDate,
        planExpiryDate: expiryDate,
        isActive: true
      }).returning();

      tenantId = newTenant[0].id;

      // Associate the user with their new tenant
      await db.insert(tenantUsers).values({
        tenantId: tenantId,
        userId: userId,
        isOwner: true,
        isPrimary: true,
        status: 'active',
        joinedAt: new Date()
      });
    }
    
    // Generate unique order ID
    const orderId = `ORD_${Date.now()}_${userId.substring(0, 8)}`;
    
    // Create payment order record
    const [paymentOrder] = await db.insert(paymentOrders).values({
      tenantId: tenantId,
      userId: userId,
      planId: planId,
      orderId: orderId,
      provider: 'phonepe',
      amountMinor: Math.round(priceNumber * 100), // Convert to paise
      currency: 'INR',
      purpose: paymentType === 'subscription' ? 'subscription_setup' : 'subscription',
      status: 'created',
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/phonepe/callback`,
      metadata: {
        planName: plan.name,
        billingCycle: plan.billingCycle,
        userEmail: user.email,
        userName: user.name,
        paymentType: paymentType
      }
    }).returning();
    
    let phonepeData;
    let responseData: {
      orderId: string;
      planName: string;
      amount: number;
      currency: string;
      paymentType: string;
      merchantTransactionId?: string;
      paymentUrl?: string;
      payload?: string;
      xVerify?: string;
      headers?: Record<string, string>;
      merchantOrderId?: string;
      merchantSubscriptionId?: string;
      subscriptionSetupUrl?: string;
      accessToken?: string;
    } = {
      orderId: orderId,
      planName: plan.name,
      amount: priceNumber,
      currency: 'INR',
      paymentType: paymentType
    };    try {
      if (paymentType === 'subscription') {
        // Use subscription setup flow
        const frequency = plan.billingCycle.toUpperCase() as 'MONTHLY' | 'YEARLY';
        
        try {
          phonepeData = await phonePeService.createSubscriptionSetup({
            userId: userId,
            planId: planId,
            mobileNumber: mobileNumber,
            amount: priceNumber,
            frequency: frequency,
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${orderId}`,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/phonepe/subscription/callback`
          });

          // Get OAuth token for subscription API
          const accessToken = await phonePeService.getAccessToken();
            responseData = {
            ...responseData,
            merchantOrderId: phonepeData.merchantOrderId,
            merchantSubscriptionId: phonepeData.merchantSubscriptionId,
            subscriptionSetupUrl: phonepeData.url,
            accessToken: accessToken,
            payload: JSON.stringify(phonepeData.payload),
            headers: {
              ...phonepeData.headers,
              'Authorization': `O-Bearer ${accessToken}`
            }
          };          // Update payment order with subscription details
          await db.update(paymentOrders)
            .set({
              providerOrderId: phonepeData.merchantOrderId,
              providerTransactionId: phonepeData.merchantSubscriptionId,
              status: 'pending'
            })
            .where(eq(paymentOrders.id, paymentOrder.id));

        } catch (subscriptionError) {
          console.warn('Subscription setup failed, falling back to standard payment:', subscriptionError);
          
          // Fallback to standard payment if subscription setup fails
          phonepeData = await phonePeService.createPayment({
            userId: userId,
            orderId: orderId,
            amount: priceNumber,
            mobileNumber: mobileNumber,
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${orderId}`,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/phonepe/callback`
          });

          responseData = {
            ...responseData,
            paymentType: 'standard', // Override to standard payment
            merchantTransactionId: phonepeData.merchantTransactionId,
            paymentUrl: phonepeData.url,
            payload: phonepeData.payload,
            xVerify: phonepeData.xVerify,
            headers: phonepeData.headers
          };

          // Update payment order with standard payment details
          await db.update(paymentOrders)
            .set({
              providerOrderId: phonepeData.merchantTransactionId,
              providerTransactionId: phonepeData.merchantTransactionId,
              status: 'pending'
            })
            .where(eq(paymentOrders.id, paymentOrder.id));
        }

      } else {
        // Use standard payment flow
        phonepeData = await phonePeService.createPayment({
          userId: userId,
          orderId: orderId,
          amount: priceNumber,
          mobileNumber: mobileNumber,
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${orderId}`,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/phonepe/callback`
        });

        responseData = {
          ...responseData,
          merchantTransactionId: phonepeData.merchantTransactionId,
          paymentUrl: phonepeData.url,
          payload: phonepeData.payload,
          xVerify: phonepeData.xVerify,
          headers: phonepeData.headers
        };

        // Update payment order with standard payment details
        await db.update(paymentOrders)
          .set({
            providerOrderId: phonepeData.merchantTransactionId,
            providerTransactionId: phonepeData.merchantTransactionId,
            status: 'pending'
          })
          .where(eq(paymentOrders.id, paymentOrder.id));
      }

      // Debug logging
      console.log('PhonePe Payment/Subscription Data:', {
        paymentType: paymentType,
        orderId: orderId,
        phonepeData: phonepeData
      });

      return NextResponse.json({
        success: true,
        data: responseData
      });

    } catch (phonepeError) {
      console.error('PhonePe API Error:', phonepeError);

      // Update payment order status to failed
      await db.update(paymentOrders)
          .set({
            status: 'failed',
            metadata: {
              ...(paymentOrder.metadata as Record<string, unknown> || {}),
              error: phonepeError instanceof PhonePeException ? {
                message: phonepeError.message,
                code: phonepeError.code,
                httpStatus: phonepeError.httpStatusCode
              } : 'Unknown PhonePe error'
            }
          })
          .where(eq(paymentOrders.id, paymentOrder.id));

      if (phonepeError instanceof PhonePeException) {
        return NextResponse.json(
          { 
            error: 'PhonePe payment failed',
            details: phonepeError.message,
            code: phonepeError.code
          },
          { status: phonepeError.httpStatusCode }
        );
      }

      throw phonepeError;
    }

  } catch (error) {
    console.error('Error creating subscription payment:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription payment' },
      { status: 500 }
    );
  }
}
