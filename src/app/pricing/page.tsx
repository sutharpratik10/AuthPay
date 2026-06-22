"use client";

import { Suspense } from 'react';
import PricingPage from '@/components/user/PricingPage';

function PricingContent() {
  return (
    <div>
      <PricingPage
        onPlanSelected={(planId) => {
          console.log('Plan selected:', planId);
        }}
      />
    </div>
  );
}

export default function PricingPreviewPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
