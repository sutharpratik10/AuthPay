import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, tenants, tenantUsers, subscriptionPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateSubscriptionExpiryDate } from '@/lib/subscription-utils';

/**
 * POST /api/subscription-plans/purchase - Purchase a subscription plan
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if subscription plan exists and is active
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
      columns: { id: true, name: true, billingCycle: true, isActive: true, price: true }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Subscription plan not found or inactive' },
        { status: 404 }
      );
    }

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

    // Check if user already has a tenant
    const existingTenant = await db.query.tenantUsers.findFirst({
      where: eq(tenantUsers.userId, userId),
      with: {
        tenant: true
      }
    });

    let tenantId: string;

    if (!existingTenant) {
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

    } else {
      // Update existing tenant's subscription plan
      tenantId = existingTenant.tenant.id;
      
      const effectiveDate = new Date();
      const expiryDate = calculateSubscriptionExpiryDate(effectiveDate, plan.billingCycle);
      
      await db
        .update(tenants)
        .set({
          planId: planId,
          planEffectiveDate: effectiveDate,
          planExpiryDate: expiryDate,
          updatedAt: new Date()
        })
        .where(eq(tenants.id, tenantId));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan`,
      data: {
        planId,
        planName: plan.name,
        billingCycle: plan.billingCycle,
        price: plan.price,
        tenantId
      }
    });

  } catch (error) {
    console.error('Error purchasing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to purchase subscription' },
      { status: 500 }
    );
  }
}
