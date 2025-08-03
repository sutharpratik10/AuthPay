import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { users, tenants, tenantUsers, subscriptionPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateSubscriptionExpiryDate } from '@/lib/subscription-utils';

/**
 * POST /api/admin/users/[userId]/assign-subscription - Assign subscription plan to user (Admin only)
 */
async function assignSubscriptionToUser(req: NextRequest) {
  try {
    // Extract userId from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 2]; // Get userId from path

    const body = await req.json();
    const { planId } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
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

    // Check if subscription plan exists
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
      columns: { id: true, name: true, billingCycle: true }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }    // Check if user already has a tenant (for individual users, they typically have their own tenant)
    const userTenant = await db.query.tenantUsers.findFirst({
      where: eq(tenantUsers.userId, userId),
      with: {
        tenant: true
      }
    });

    let tenantId: string;    if (!userTenant) {
      // Create a new tenant for this user if they don't have one
      // Generate a shorter slug (max 50 chars) by using first 8 chars of userId + timestamp
      const shortUserId = userId.substring(0, 8);
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits
      const slug = `user-${shortUserId}-${timestamp}`;
        // Ensure tenant name doesn't exceed 255 chars
      const tenantName = `${user.name || user.email}'s Workspace`;
      const truncatedName = tenantName.length > 255 ? tenantName.substring(0, 252) + '...' : tenantName;
      
      // Calculate expiration date based on billing cycle
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
      });    } else {
      // Update existing tenant's subscription plan
      tenantId = userTenant.tenant.id;
      
      // Calculate new expiration date based on billing cycle
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
      message: `Subscription plan "${plan.name}" assigned to user successfully`,
      data: {
        userId,
        planId,
        planName: plan.name,
        tenantId
      }
    });

  } catch (error) {
    console.error('Assign subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to assign subscription plan' },
      { status: 500 }
    );
  }
}

// Export route handler with permission checking
export const POST = withPermission(assignSubscriptionToUser, API_PERMISSIONS.USER_EDIT);
