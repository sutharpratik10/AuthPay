
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { subscriptionPlans } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { withApiHandler } from '@/lib/api/helpers';

export const runtime = "nodejs";

/**
 * POST /api/admin/subscription-plans/reorder
 * Reorder subscription plans
 * 
 * @protected Requires admin authentication
 * @body {string[]} planIds - Array of plan IDs in the desired order
 */
export const POST = withApiHandler(
    async (request, { user }) => {
        try {
            const body = await request.json();

            // Handle new format with metadata (plans array of objects)
            if (body.plans && Array.isArray(body.plans)) {
                const plans = body.plans as { id: string, badgeText?: string, enableAutoPopular?: boolean }[];

                if (plans.length === 0) {
                    return NextResponse.json({ success: false, error: "No plans provided" }, { status: 400 });
                }

                await db.transaction(async (tx) => {
                    for (let i = 0; i < plans.length; i++) {
                        const plan = plans[i];
                        await tx
                            .update(subscriptionPlans)
                            .set({
                                displayOrder: i + 1,
                                badgeText: plan.badgeText,
                                enableAutoPopular: plan.enableAutoPopular
                            })
                            .where(eq(subscriptionPlans.id, plan.id));
                    }
                });
            }
            // Handle legacy format (planIds string array)
            else if (body.planIds && Array.isArray(body.planIds)) {
                const planIds = body.planIds as string[];

                if (planIds.length === 0) {
                    return NextResponse.json({ success: false, error: "No plan IDs provided" }, { status: 400 });
                }

                await db.transaction(async (tx) => {
                    for (let i = 0; i < planIds.length; i++) {
                        const planId = planIds[i];
                        await tx
                            .update(subscriptionPlans)
                            .set({ displayOrder: i + 1 })
                            .where(eq(subscriptionPlans.id, planId));
                    }
                });
            } else {
                return NextResponse.json(
                    { success: false, error: "Invalid request format" },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                message: "Plans reordered successfully"
            });
        } catch (error) {
            console.error("Error reordering plans:", error);
            return NextResponse.json(
                { success: false, error: "Failed to reorder plans" },
                { status: 500 }
            );
        }
    },
    {
        requireAuth: true,
        requireAdmin: true
    }
);
