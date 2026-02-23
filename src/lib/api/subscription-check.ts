/**
 * Subscription Check Utility
 * 
 * Provides utilities to check if a user has an active subscription
 */

import { db } from '@/server/db';
import { userSubscriptions, subscriptionStatuses } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

export interface SubscriptionStatus {
    hasActiveSubscription: boolean;
    subscriptionId?: string;
    planId?: string;
    expiryDate?: string;
}

/**
 * Check if a user has an active subscription
 */
export async function checkUserSubscription(userId: string): Promise<SubscriptionStatus> {
    // Get active status ID
    const activeStatus = await db.query.subscriptionStatuses.findFirst({
        where: eq(subscriptionStatuses.name, 'active'),
    });

    if (!activeStatus) {
        return { hasActiveSubscription: false };
    }

    // Find user's active subscription
    const subscription = await db.query.userSubscriptions.findFirst({
        where: and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.statusId, activeStatus.id)
        ),
    });

    if (!subscription) {
        return { hasActiveSubscription: false };
    }

    // Check if subscription is not expired
    if (subscription.expiryDate) {
        const expiryDate = new Date(subscription.expiryDate);
        if (expiryDate < new Date()) {
            return { hasActiveSubscription: false };
        }
    }

    return {
        hasActiveSubscription: true,
        subscriptionId: subscription.id,
        planId: subscription.planId || undefined,
        expiryDate: subscription.expiryDate || undefined,
    };
}

/**
 * Require active subscription - throws error if not subscribed
 */
export async function requireActiveSubscription(userId: string): Promise<SubscriptionStatus> {
    const status = await checkUserSubscription(userId);

    if (!status.hasActiveSubscription) {
        throw new Error('Active subscription required to access this feature');
    }

    return status;
}
