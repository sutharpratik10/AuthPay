"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, Crown, Zap, Star, ArrowRight, CheckCircle, Sparkles, Shield, Rocket, Users, Building, Infinity } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: string;
  billingCycle: string;
  features: string[];
  priceNumber: number;
}

interface SubscriptionPlansProps {
  onPlanSelected?: (planId: string) => void;
  showTitle?: boolean;
  className?: string;
}

export default function SubscriptionPlansSelector({ 
  onPlanSelected,
  showTitle = true,
  className = ""
}: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  // Load subscription plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await fetch('/api/subscription-plans');
        const data = await response.json();
        
        if (data.success) {
          setPlans(data.data.plans);
        } else {
          toast({
            title: "Error",
            description: "Failed to load subscription plans",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading plans:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription plans",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPlans();  }, [toast]);
  // Handle plan purchase (direct activation without modal)
  const handlePurchasePlan = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      toast({
        title: "Error",
        description: "Plan not found",
        variant: "destructive"
      });
      return;
    }
    
    setPurchasing(planId);
    
    try {
      // Use internal subscription purchase endpoint directly
      const response = await fetch('/api/subscription-plans/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          planId: planId
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        toast({
          title: "Subscription Activated",
          description: `Your ${plan.name} subscription has been activated successfully!`,
          variant: "default"
        });

        // Call the callback if provided
        if (onPlanSelected) {
          onPlanSelected(planId);
        }
        
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to purchase subscription",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error purchasing plan:', error);
      toast({
        title: "Error",
        description: "Failed to purchase subscription. Please try again.",
        variant: "destructive"
      });    } finally {
      setPurchasing(null);
    }
  };
  // Minimal plan icon
  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('starter') || name.includes('free')) {
      return <Zap className="h-6 w-6 text-blue-500 dark:text-blue-400" />;
    } else if (name.includes('pro') || name.includes('professional') || name.includes('premium')) {
      return <Star className="h-6 w-6 text-purple-500 dark:text-purple-400" />;
    } else if (name.includes('enterprise') || name.includes('business')) {
      return <Crown className="h-6 w-6 text-amber-500 dark:text-amber-400" />;
    }
    return <Sparkles className="h-6 w-6 text-gray-500 dark:text-gray-400" />;
  };

  // Minimal color scheme
  const getPlanColorScheme = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('starter') || name.includes('free')) {
      return {
        accent: "blue",
        popular: false
      };
    } else if (name.includes('pro') || name.includes('professional') || name.includes('premium')) {
      return {
        accent: "purple",
        popular: true
      };
    } else if (name.includes('enterprise') || name.includes('business')) {
      return {
        accent: "amber",
        popular: false
      };
    }
    return {
      accent: "gray",
      popular: false
    };
  };

  // Group plans by billing cycle
  const monthlyPlans = plans.filter(plan => plan.billingCycle === 'monthly');
  const yearlyPlans = plans.filter(plan => plan.billingCycle === 'yearly');
  
  // Get current plans based on selected tab
  const currentPlans = selectedBillingCycle === 'monthly' ? monthlyPlans : yearlyPlans;
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary" />
          </div>
          <p className="text-base font-medium text-foreground">Loading Plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative space-y-10 py-10">
        {showTitle && (
          <div className="text-center space-y-4 max-w-2xl mx-auto px-2">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Choose Your Plan</h2>
            <p className="text-base text-muted-foreground">Upgrade or downgrade at any time. No hidden fees.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" />14-day free trial</div>
              <div className="flex items-center gap-1"><Shield className="h-4 w-4 text-blue-500" />Cancel anytime</div>
              <div className="flex items-center gap-1"><Users className="h-4 w-4 text-purple-500" />24/7 support</div>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-muted rounded-lg p-1 border border-border">
            <button
              onClick={() => setSelectedBillingCycle('monthly')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${selectedBillingCycle === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedBillingCycle('yearly')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${selectedBillingCycle === 'yearly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Yearly
              {selectedBillingCycle === 'yearly' && (
                <span className="ml-2 text-green-600 dark:text-green-400 font-semibold text-xs">Save 17%</span>
              )}
            </button>
          </div>
        </div>
        
        {/* Plans Grid */}
        {currentPlans.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto px-2">
            {currentPlans.map((plan) => {
              const colorScheme = getPlanColorScheme(plan.name);
              const isPurchasing = purchasing === plan.id;
              const isYearly = selectedBillingCycle === 'yearly';
              const monthlyEquivalent = isYearly ? plan.priceNumber / 12 : plan.priceNumber;
              return (
                <div key={plan.id} className={`relative group w-full max-w-sm ${colorScheme.popular ? 'z-10' : ''}`}>
                  {colorScheme.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold shadow">Most Popular</div>
                    </div>
                  )}
                  <Card className={`relative border border-border bg-background/90 hover:bg-background transition-colors duration-200 shadow-sm group-hover:shadow-md`}> 
                    <CardHeader className="relative text-center pb-4 pt-8">
                      <div className="mx-auto mb-3 flex items-center justify-center h-10 w-10 rounded-lg bg-muted">{getPlanIcon(plan.name)}</div>
                      <CardTitle className="text-lg font-semibold mb-1">{plan.name}</CardTitle>
                      <Badge className={`mx-auto bg-${colorScheme.accent}-100 text-${colorScheme.accent}-800 dark:bg-${colorScheme.accent}-900/30 dark:text-${colorScheme.accent}-300 border-0`}>{isYearly ? 'Annual' : 'Monthly'}</Badge>
                    </CardHeader>
                    <CardContent className="relative text-center space-y-5 px-4 pb-6">
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold text-foreground">${plan.priceNumber}</span>
                          <span className="text-base text-muted-foreground font-medium">/{isYearly ? 'year' : 'month'}</span>
                        </div>
                        {isYearly && (
                          <div className="text-xs text-green-600 dark:text-green-400">${monthlyEquivalent.toFixed(2)}/mo billed annually</div>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-muted-foreground text-sm leading-relaxed">{plan.description}</p>
                      )}
                      <ul className="space-y-2 text-left mt-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-foreground text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full py-3 text-base font-medium rounded-lg mt-2 transition-all duration-200 ${colorScheme.popular ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'} ${isPurchasing ? 'opacity-70' : ''}`}
                        onClick={() => handlePurchasePlan(plan.id)}
                        disabled={isPurchasing}
                      >
                        {isPurchasing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2" />
                            Activating...
                          </>
                        ) : (
                          <>
                            {colorScheme.popular && <Crown className="h-4 w-4 mr-1" />}
                            Get Started
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No Plans Available</h3>
              <p className="text-muted-foreground text-sm">Check back later for subscription options.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
