// src/app/api/admin/payment-gateways/[id]/route.ts
//
// PATCH  /api/admin/payment-gateways/:id  — update a gateway rule
// DELETE /api/admin/payment-gateways/:id  — delete a gateway rule

import { NextRequest } from "next/server";
import { withDynamicApiHandler, errorResponse, successResponse } from "@/lib/api/helpers";
import { db } from "@/server/db";
import { paymentGatewayConfig } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api/permissions";

export const runtime = "nodejs";

/** PATCH /api/admin/payment-gateways/:id — update a rule */
export const PATCH = withDynamicApiHandler<{ id: string }>(
  async (req: NextRequest, { params }) => {
    const adminCheck = await requireAdmin();
    if (!adminCheck.isAdmin) return errorResponse("Forbidden", 403);

    const { id } = params;
    const body = (await req.json()) as {
      countryCode?: string | null;
      gateway?: string;
      isEnabled?: boolean;
      isDefault?: boolean;
      notes?: string;
    };

    const VALID_GATEWAYS = ["razorpay", "stripe", "none"];
    if (body.gateway && !VALID_GATEWAYS.includes(body.gateway)) {
      return errorResponse(
        `Invalid gateway. Must be one of: ${VALID_GATEWAYS.join(", ")}`,
        400
      );
    }

    // If marking as default, unset existing defaults first
    if (body.isDefault === true) {
      await db
        .update(paymentGatewayConfig)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(paymentGatewayConfig.isDefault, true));
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.gateway !== undefined) updateData.gateway = body.gateway;
    if (body.isEnabled !== undefined) updateData.isEnabled = body.isEnabled;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if ("countryCode" in body) {
      updateData.countryCode =
        body.countryCode?.trim().toUpperCase().slice(0, 2) ?? null;
    }

    const [updated] = await db
      .update(paymentGatewayConfig)
      .set(updateData as Parameters<typeof db.update>[0] extends infer T ? T : never)
      .where(eq(paymentGatewayConfig.id, id))
      .returning();

    if (!updated) return errorResponse("Rule not found", 404);

    return successResponse(updated, "Gateway rule updated");
  }
);

/** DELETE /api/admin/payment-gateways/:id — remove a rule */
export const DELETE = withDynamicApiHandler<{ id: string }>(
  async (_req: NextRequest, { params }) => {
    const adminCheck = await requireAdmin();
    if (!adminCheck.isAdmin) return errorResponse("Forbidden", 403);

    const { id } = params;

    const [deleted] = await db
      .delete(paymentGatewayConfig)
      .where(eq(paymentGatewayConfig.id, id))
      .returning({ id: paymentGatewayConfig.id });

    if (!deleted) return errorResponse("Rule not found", 404);

    return successResponse({ id: deleted.id }, "Gateway rule deleted");
  }
);
