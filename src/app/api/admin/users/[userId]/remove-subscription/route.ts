import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { users, tenants, tenantUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/admin/users/[userId]/remove-subscription - Remove subscription from user (Admin only)
 */
async function removeSubscriptionFromUser(req: NextRequest) {
  try {
    // Extract userId from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 2]; // Get userId from path

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Find user's tenant
    const userTenant = await db.query.tenantUsers.findFirst({
      where: eq(tenantUsers.userId, userId),
      with: {
        tenant: true
      }
    });

    if (!userTenant) {
      return NextResponse.json(
        { error: 'User has no tenant or subscription to remove' },
        { status: 404 }
      );
    }

    // Remove subscription plan from tenant
    await db
      .update(tenants)
      .set({
        planId: null,
        planEffectiveDate: null,
        planExpiryDate: null,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, userTenant.tenant.id));

    return NextResponse.json({
      success: true,
      message: 'Subscription removed from user successfully',
      data: {
        userId,
        tenantId: userTenant.tenant.id
      }
    });

  } catch (error) {
    console.error('Remove subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}

// Export route handler with permission checking
export const POST = withPermission(removeSubscriptionFromUser, API_PERMISSIONS.USER_EDIT);
