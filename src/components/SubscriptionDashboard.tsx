"use client"

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import SubscriptionPlansSelector from './SubscriptionPlansSelector';

export default function SubscriptionDashboard() {
  const subscriptionStatus = { hasSubscription: false }; // This should come from your actual subscription logic

  // If user has no subscription, show subscription plans
  if (!subscriptionStatus?.hasSubscription) {
    return (
      <div className="space-y-8">
        {/* Welcome Message */}        <Card className="bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-950/50 dark:via-gray-950/50 dark:to-zinc-950/50 border-0 shadow-xl backdrop-blur-sm">
          <CardContent className="p-10 text-center">
            <div className="mb-6">
              <div className="mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 shadow-xl w-fit">
                {/* <Package className="h-12 w-12 text-white" /> */}
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
              Welcome to TrueAuth!
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Get started by choosing a subscription plan that fits your needs. 
              Unlock powerful features and take your experience to the next level.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-6">
              <div className="w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
              <Button className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 dark:from-slate-600 dark:to-slate-800 dark:hover:from-slate-700 dark:hover:to-slate-900 text-white border-0 px-8 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                Explore Plans Below
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <SubscriptionPlansSelector 
          showTitle={false}
          onPlanSelected={(planId) => {
            console.log('Plan selected:', planId);
          }}
        />
      </div>
    );
  }

  // If user has an active subscription, show a different message
  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <Card className="bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-950/50 dark:via-gray-950/50 dark:to-zinc-950/50 border-0 shadow-xl backdrop-blur-sm">
        <CardContent className="p-10 text-center">          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
            Welcome to TrueAuth!
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
            You already have an active subscription.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
