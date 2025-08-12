import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import {userSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getExpiryStatus } from '@/lib/subscription-utils';

/**
 * GET /api/user/subscription-status - Get current user's subscription status
 */

// Define the type for the subscription query result
interface SubscriptionPlan {
  id: string | number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  features?: string;
}
interface UserSubscription {
  plan: SubscriptionPlan;
  expiryDate?: string;
  startDate?: string;
  status: string;
}

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

    // Get user's subscription info
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
      with: {
        plan: true
      }
    }) as UserSubscription | null;

    if (!subscription || !subscription.plan) {
      return NextResponse.json({
        success: true,
        data: {
          hasSubscription: false,
          message: 'No subscription found'
        }
      });
    }

    // Get expiry status
    const expiryDate = subscription.expiryDate ? new Date(subscription.expiryDate) : null;
    const expiryStatus = getExpiryStatus(expiryDate);
    return NextResponse.json({
      success: true,
      data: {
        hasSubscription: true,
        planId: subscription.plan.id,
        planName: subscription.plan.name,
        planDescription: subscription.plan.description,
        price: `$${subscription.plan.price}`,
        billingCycle: subscription.plan.billingCycle,
        features: subscription.plan.features ? JSON.parse(subscription.plan.features) : [],
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        isActive: subscription.status === 'active',
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
