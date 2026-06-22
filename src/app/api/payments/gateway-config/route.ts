// src/app/api/payments/gateway-config/route.ts
//
// Returns the active payment gateway for the current visitor.
// The frontend calls this on mount to decide whether to show Razorpay or Stripe.
//
// GET /api/payments/gateway-config
// Response: { gateway: 'razorpay' | 'stripe', countryCode: string }

import { NextRequest, NextResponse } from "next/server";
import {
  getGatewayForCountry,
  getCountryFromRequest,
} from "@/lib/payments/gateway-router";

export const runtime = "nodejs";

// Light cache — avoid a DB round-trip on every page load.
// The value changes only when an admin updates the config.
export const revalidate = 60; // seconds

export async function GET(req: NextRequest) {
  try {
    const countryCode = getCountryFromRequest(req);
    const gateway = await getGatewayForCountry(countryCode);

    return NextResponse.json(
      { gateway, countryCode },
      {
        headers: {
          // Allow client to cache for 60 s; CDN for 5 min
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      }
    );
  } catch (error) {
    console.error("[gateway-config] Error resolving gateway:", error);
    // Safe fallback — return Stripe so international users aren't blocked
    return NextResponse.json({ gateway: "stripe", countryCode: "XX" });
  }
}
