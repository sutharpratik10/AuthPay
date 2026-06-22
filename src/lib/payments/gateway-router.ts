// src/lib/payments/gateway-router.ts
//
// Resolves which payment gateway to use for a given country code.
// Priority (highest to lowest):
//   1. Admin country-specific DB rule (country_code = 'XX')
//   2. Admin global default DB rule   (country_code IS NULL + is_default = true)
//   3. Hard-coded defaults            (IN → razorpay, everywhere else → stripe)

import { db } from "@/server/db";
import { paymentGatewayConfig } from "@/server/db/schema";
import { eq, isNull, or } from "drizzle-orm";
import { NextRequest } from "next/server";

export type GatewayName = "razorpay" | "stripe";

/** Hard-coded fallbacks — overridden by DB config when present */
const COUNTRY_DEFAULTS: Record<string, GatewayName> = {
  IN: "razorpay", // India
};
const GLOBAL_DEFAULT: GatewayName = "stripe";

/**
 * Returns the correct payment gateway for a given ISO 3166-1 alpha-2 country code.
 * Queries the `payment_gateway_config` table first; falls back to hard-coded defaults.
 */
export async function getGatewayForCountry(
  countryCode: string
): Promise<GatewayName> {
  const upper = countryCode.toUpperCase();

  try {
    // Pull both country-specific and global rules in one query
    const configs = await db
      .select()
      .from(paymentGatewayConfig)
      .where(
        or(
          eq(paymentGatewayConfig.countryCode, upper),
          isNull(paymentGatewayConfig.countryCode)
        )
      );

    // Country-specific rule takes precedence
    const countryRule = configs.find(
      (c) => c.countryCode === upper && c.isEnabled
    );
    if (countryRule) return countryRule.gateway as GatewayName;

    // Global default rule
    const globalRule = configs.find(
      (c) => c.countryCode === null && c.isEnabled && c.isDefault
    );
    if (globalRule) return globalRule.gateway as GatewayName;
  } catch (err) {
    console.warn(
      "[gateway-router] DB query failed, falling back to hard-coded defaults:",
      err
    );
  }

  return COUNTRY_DEFAULTS[upper] ?? GLOBAL_DEFAULT;
}

/**
 * Extracts the visitor's country code from common CDN/edge headers.
 * Returns 'US' as a safe fallback when no header is present.
 *
 * Supported headers (checked in priority order):
 *   - CF-IPCountry      (Cloudflare)
 *   - X-Vercel-IP-Country (Vercel Edge Network)
 *   - X-Country-Code    (custom header — set by your own middleware/proxy)
 */
export function getCountryFromRequest(req: NextRequest): string {
  const cf = req.headers.get("cf-ipcountry");
  if (cf && cf !== "XX" && cf !== "T1") return cf.toUpperCase();

  const vercel = req.headers.get("x-vercel-ip-country");
  if (vercel) return vercel.toUpperCase();

  const custom = req.headers.get("x-country-code");
  if (custom) return custom.toUpperCase();

  return "US"; // safe fallback → Stripe
}
