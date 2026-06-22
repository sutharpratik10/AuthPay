// src/hooks/use-payment-gateway.ts
//
// Fetches the active payment gateway for the current visitor from the server.
// The server reads CDN geo-headers (Cloudflare, Vercel) to determine country,
// then applies admin DB rules or hard-coded defaults.
//
// Usage:
//   const { gateway, countryCode, loading } = usePaymentGateway();
//   // gateway === 'razorpay' | 'stripe'

"use client";

import { useState, useEffect } from "react";

export type GatewayName = "razorpay" | "stripe";

interface GatewayState {
  gateway: GatewayName;
  countryCode: string;
  loading: boolean;
}

export function usePaymentGateway(): GatewayState {
  const [state, setState] = useState<GatewayState>({
    gateway: "stripe", // optimistic default — replaced on first load
    countryCode: "",
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchGateway() {
      try {
        const res = await fetch("/api/payments/gateway-config");
        if (!res.ok) throw new Error("Failed to fetch gateway config");
        const data = (await res.json()) as {
          gateway: GatewayName;
          countryCode: string;
        };
        if (!cancelled) {
          setState({ gateway: data.gateway, countryCode: data.countryCode, loading: false });
        }
      } catch {
        // Keep the optimistic default on error
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    }

    fetchGateway();
    return () => { cancelled = true; };
  }, []);

  return state;
}
