"use client"

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PricingPage from './PricingPage';
import { getAppName } from '@/lib/utils/config';

export default function SubscriptionDashboard() {
  const subscriptionStatus = { hasSubscription: false }; // This should come from your actual subscription logic

  // If user has no subscription, show pricing page
  if (!subscriptionStatus?.hasSubscription) {
    return (
      <PricingPage 
        onPlanSelected={(planId) => {
          console.log('Plan selected:', planId);
        }}
      />
    );
  }

  // If user has an active subscription, show a different message
  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <Card className="bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-950/50 dark:via-gray-950/50 dark:to-zinc-950/50 border-0 shadow-xl backdrop-blur-sm">
        <CardContent className="p-10 text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
            Welcome to {(getAppName() ?? "").charAt(0)}!
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
            You already have an active subscription.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
