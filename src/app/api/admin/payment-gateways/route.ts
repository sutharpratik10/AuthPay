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
import { eq, inArray, isNull } from "drizzle-orm";
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
    countryCodes?: string[];
    isExcept?: boolean;
    gateway: string;
    isEnabled?: boolean;
    isDefault?: boolean;
    notes?: string;
  };

  const { countryCode, countryCodes, isExcept = false, gateway, isEnabled = true, isDefault = false, notes } = body;

  const VALID_GATEWAYS = ["razorpay", "stripe", "none"];
  if (!gateway || !VALID_GATEWAYS.includes(gateway)) {
    return errorResponse(
      `Invalid gateway. Must be one of: ${VALID_GATEWAYS.join(", ")}`,
      400
    );
  }

  if (isExcept && gateway === "none") {
    return errorResponse("Except mode requires gateway to be either razorpay or stripe.", 400);
  }

  const normalizeCountryCode = (value: string): string | null => {
    const normalized = value.trim().toUpperCase().slice(0, 2);
    return normalized.length === 2 ? normalized : null;
  };

  const incoming = [
    ...(countryCode ? [countryCode] : []),
    ...((countryCodes ?? []).filter(Boolean)),
  ];

  const countries = Array.from(
    new Set(
      incoming
        .map((value) => normalizeCountryCode(value))
        .filter((value): value is string => value !== null)
    )
  );

  if (!isDefault && !isExcept && !countryCode && countries.length === 0) {
    return errorResponse("Select at least one country or mark the rule as global default.", 400);
  }

  // If marking as default or if isExcept (which creates a global default), unset existing defaults
  if (isDefault || isExcept) {
    await db
      .update(paymentGatewayConfig)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(paymentGatewayConfig.isDefault, true));
  }

  const valuesToInsert: Array<{
    countryCode: string | null;
    gateway: string;
    isEnabled: boolean;
    isDefault: boolean;
    notes?: string;
    createdBy: string;
  }> = [];

  const addRule = (code: string | null, def: boolean, gw: string) => {
    valuesToInsert.push({
      countryCode: code,
      gateway: gw,
      isEnabled,
      isDefault: def,
      notes: notes ?? undefined,
      createdBy: user!.id,
    });
  };

  if (isExcept) {
    // Show in all countries EXCEPT the selected ones
    // 1. Create global default for the selected gateway
    addRule(null, true, gateway);

    // 2. Selected countries should get the opposite gateway automatically
    const oppositeGateway = gateway === "razorpay" ? "stripe" : "razorpay";
    countries.forEach(code => {
      addRule(code, false, oppositeGateway);
    });
  } else if (countries.length > 0) {
    // Show in specific countries
    countries.forEach(code => {
      addRule(code, false, gateway);
    });
  } else {
    // Just a global default or a single rule without countryCode
    addRule(null, isDefault, gateway);
  }

  if (valuesToInsert.length === 0) {
    return errorResponse("No valid countries provided to create rules for.", 400);
  }

  const created = await db.transaction(async (tx) => {
    // Replace any existing global rows when a new global/default rule is being created.
    if (isDefault || isExcept || valuesToInsert.some((value) => value.countryCode === null)) {
      await tx.delete(paymentGatewayConfig).where(isNull(paymentGatewayConfig.countryCode));
    }

    // Replace existing country rows for selected countries to avoid duplicate/ambiguous routing rules.
    if (countries.length > 0) {
      await tx
        .delete(paymentGatewayConfig)
        .where(inArray(paymentGatewayConfig.countryCode, countries));
    }

    return tx.insert(paymentGatewayConfig).values(valuesToInsert).returning();
  });

  return successResponse(created, "Gateway rule(s) created", 201);
});
