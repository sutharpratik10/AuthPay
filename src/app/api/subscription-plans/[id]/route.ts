import { subscriptionPlanService } from '@/services/subscription-plans';
import { withDynamicApiHandler, successResponse, errorResponse } from '@/lib/api-helpers';

/**
 * GET /api/subscription-plans/[id] - Get subscription plan by ID
 */
export const GET = withDynamicApiHandler<{ id: string }>(
  async (request, { params }) => {
    const planId = params.id;

    if (!planId) {
      return errorResponse('Plan ID is required', 400);
    }

    const plan = await subscriptionPlanService.getSubscriptionPlanById(planId);

    return successResponse({ plan });
  }
  // No auth required - public route
);

