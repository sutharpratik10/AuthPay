// src/app/api/admin/payment-gateways/route.ts
//
// Admin API for managing payment gateway configuration.
// Controls which gateway (Razorpay / Stripe) is shown per country or globally.
//
// GET    /api/admin/payment-gateways          - list all config entries
// POST   /api/admin/payment-gateways          - create a new rule
// PATCH  /api/admin/payment-gateways/[id]     - handled in [id]/route.ts
// DELETE /api/admin/payment-gateways/[id]     - handled in [id]/route.ts
//
// Each entry:
//   countryCode: ISO 3166-1 alpha-2, e.g. "IN", "US" — NULL means global default
//   gateway    : "razorpay" | "stripe" | "none"
//   isEnabled  : activate / deactivate without deleting
//   isDefault  : mark as global fallback (only one should be default)

import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, errorResponse, successResponse } from "@/lib/api/helpers";
import { db } from "@/server/db";
import { paymentGatewayConfig } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api/permissions";

export const runtime = "nodejs";

/** GET /api/admin/payment-gateways — list all rules */
export const GET = withApiHandler(async (_req: NextRequest, { user }) => {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) return errorResponse("Forbidden", 403);

  const configs = await db
    .select()
    .from(paymentGatewayConfig)
    .orderBy(paymentGatewayConfig.createdAt);

  return successResponse(configs, "Gateway configurations loaded");
});

/** POST /api/admin/payment-gateways — create a new rule */
export const POST = withApiHandler(async (req: NextRequest, { user }) => {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) return errorResponse("Forbidden", 403);

  const body = (await req.json()) as {
    countryCode?: string | null;
    gateway: string;
    isEnabled?: boolean;
    isDefault?: boolean;
    notes?: string;
  };

  const { countryCode, gateway, isEnabled = true, isDefault = false, notes } = body;

  const VALID_GATEWAYS = ["razorpay", "stripe", "none"];
  if (!gateway || !VALID_GATEWAYS.includes(gateway)) {
    return errorResponse(
      `Invalid gateway. Must be one of: ${VALID_GATEWAYS.join(", ")}`,
      400
    );
  }

  // Normalise country code
  const normCode =
    countryCode && countryCode.trim().length > 0
      ? countryCode.trim().toUpperCase().slice(0, 2)
      : null;

  // If marking as default, unset existing defaults
  if (isDefault) {
    await db
      .update(paymentGatewayConfig)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(paymentGatewayConfig.isDefault, true));
  }

  const [created] = await db
    .insert(paymentGatewayConfig)
    .values({
      countryCode: normCode ?? undefined,
      gateway,
      isEnabled,
      isDefault,
      notes: notes ?? undefined,
      createdBy: user!.id,
    })
    .returning();

  return successResponse(created, "Gateway rule created", 201);
});
