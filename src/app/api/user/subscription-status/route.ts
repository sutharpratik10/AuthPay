import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { tenantUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getExpiryStatus } from '@/lib/subscription-utils';

/**
 * GET /api/user/subscription-status - Get current user's subscription status
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's tenant and subscription info
    const userTenant = await db.query.tenantUsers.findFirst({
      where: eq(tenantUsers.userId, userId),
      with: {
        tenant: {
          with: {
            subscriptionPlan: true
          }
        }
      }
    });

    if (!userTenant?.tenant) {
      return NextResponse.json({
        success: true,
        data: {
          hasSubscription: false,
          message: 'No subscription found'
        }
      });
    }

    const tenant = userTenant.tenant;
    const plan = tenant.subscriptionPlan;

    if (!plan) {
      return NextResponse.json({
        success: true,
        data: {
          hasSubscription: false,
          message: 'No subscription plan assigned'
        }
      });
    }

    // Get expiry status
    const expiryStatus = getExpiryStatus(tenant.planExpiryDate);    return NextResponse.json({
      success: true,
      data: {
        hasSubscription: true,
        planId: plan.id,
        planName: plan.name,
        planDescription: plan.description,
        price: `$${plan.price}`,
        billingCycle: plan.billingCycle,
        features: plan.features ? JSON.parse(plan.features) : [],
        startDate: tenant.planEffectiveDate,
        expiryDate: tenant.planExpiryDate,
        isActive: tenant.isActive,
        status: expiryStatus.status,
        message: expiryStatus.message,
        daysRemaining: expiryStatus.daysRemaining
      }
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
