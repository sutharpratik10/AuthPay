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
        {/* Welcome Message */}
        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 border-0 shadow-xl backdrop-blur-sm">
          <CardContent className="p-10 text-center">
            <div className="mb-6">
              <div className="mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl w-fit">
                {/* <Package className="h-12 w-12 text-white" /> */}
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Welcome to TrueAuth!
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Get started by choosing a subscription plan that fits your needs. 
              Unlock powerful features and take your experience to the next level.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-6">
              <div className="w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
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
      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 border-0 shadow-xl backdrop-blur-sm">
        <CardContent className="p-10 text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
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
