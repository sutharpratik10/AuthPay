import { NextRequest } from 'next/server';
import { withApiHandler, successResponse, errorResponse } from '@/lib/api/helpers';
import { db } from '@/server/db';
import { userSubscriptions, subscriptionPlans, subscriptionStatuses } from '@/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * GET /api/user/subscription-history - Get user's subscription history
 * Rate Limited: 60 requests per minute
 * Uses centralized API helpers for auth and response handling
 */
export const GET = rateLimiters.api(
  withApiHandler(
    async (_req: NextRequest, { user }) => {
      const userId = user!.id;

      // Get all subscriptions for the user, newest first
      const rows = await db
        .select({
          planName: subscriptionPlans.name,
          statusId: userSubscriptions.statusId,
          startDate: userSubscriptions.startDate,
          expiryDate: userSubscriptions.expiryDate,
          endDate: userSubscriptions.endDate,
          amount: subscriptionPlans.price,
          razorpaySubscriptionId: userSubscriptions.razorpaySubscriptionId,
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userSubscriptions.userId, userId))
        .orderBy(desc(userSubscriptions.createdAt));

      // Fetch all status names in one go for mapping
      const statusIds = Array.from(new Set(rows.map((r: any) => r.statusId).filter(Boolean))) as string[];
      let statusMap: Record<string, string> = {};
      if (statusIds.length > 0) {
        const statuses = await db
          .select({ id: subscriptionStatuses.id, name: subscriptionStatuses.name })
          .from(subscriptionStatuses)
          .where(inArray(subscriptionStatuses.id, statusIds));
        statusMap = Object.fromEntries(statuses.map((s: any) => [s.id, s.name]));
      }

      const history = rows.map(r => ({
        planName: r.planName,
        status: statusMap[r.statusId] || '',
        startDate: r.startDate,
        expiryDate: r.expiryDate,
        endDate: r.endDate,
        amount: r.amount,
        razorpaySubscriptionId: r.razorpaySubscriptionId,
      }));

      return successResponse({ history });
    },
    { requireAuth: true }
  )
);
