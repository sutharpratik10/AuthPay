import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, subscriptionPlans, paymentOrders, tenants, tenantUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { phonePeService } from '@/lib/phonepe';
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

    const { planId, mobileNumber } = await req.json();

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
        isActive: true 
      }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Subscription plan not found or inactive' },
        { status: 404 }
      );
    }    // Parse price (remove currency symbols and convert to number)
    const priceNumber = parseFloat(plan.price.replace(/[^0-9.]/g, ''));
    
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
      purpose: 'subscription',
      status: 'created',
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/phonepe/callback`,
      metadata: {
        planName: plan.name,
        billingCycle: plan.billingCycle,
        userEmail: user.email,
        userName: user.name
      }
    }).returning();    // Create PhonePe standard payment request (since subscription APIs may not be available in sandbox)
    const phonepeData = await phonePeService.createPayment({
      userId: userId,
      orderId: orderId,
      amount: priceNumber,
      mobileNumber: mobileNumber,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${orderId}`,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/phonepe/callback`
    });    // Debug logging
    console.log('PhonePe Payment Data:', {
      url: phonepeData.url,
      payload: phonepeData.payload,
      xVerify: phonepeData.xVerify,
      headers: phonepeData.headers,
      merchantTransactionId: phonepeData.merchantTransactionId,
      payloadDecoded: JSON.parse(Buffer.from(phonepeData.payload, 'base64').toString())
    });// Update payment order with PhonePe details
    await db.update(paymentOrders)
      .set({
        providerOrderId: phonepeData.merchantTransactionId,
        providerTransactionId: phonepeData.merchantTransactionId,
        status: 'pending'
      })
      .where(eq(paymentOrders.id, paymentOrder.id));    return NextResponse.json({
      success: true,
      data: {
        orderId: orderId,
        merchantTransactionId: phonepeData.merchantTransactionId,
        paymentUrl: phonepeData.url,
        payload: phonepeData.payload,
        xVerify: phonepeData.xVerify,
        planName: plan.name,
        amount: priceNumber,
        currency: 'INR'
      }
    });

  } catch (error) {
    console.error('Error creating PhonePe subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription payment' },
      { status: 500 }
    );
  }
}
