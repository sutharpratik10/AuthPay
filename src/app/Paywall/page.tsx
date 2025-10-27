import React from "react";
import { Suspense } from "react";
import PaywallContainer from "@/components/Paywall/PaywallContainer";

export default function PaywallPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div>Loading content...</div>}>
        <PaywallContainer />
      </Suspense>
    </div>
  );
}
