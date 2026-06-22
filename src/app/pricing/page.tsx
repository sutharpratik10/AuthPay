"use client";

import PricingPage from '@/components/user/PricingPage';

export default function PricingPreviewPage() {
  return (
    <div>
      <PricingPage 
        onPlanSelected={(planId) => {
          console.log('Selected plan:', planId);
          alert(`You selected the ${planId} plan!`);
        }}
      />
    </div>
  );
}
