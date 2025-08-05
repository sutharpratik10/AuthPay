"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Check, 
  Crown, 
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Shield,
  Rocket,
  Users,
  Building,
  Infinity
} from 'lucide-react';

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
  // Get plan icon with enhanced design
  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('starter') || name.includes('free')) {
      return <Zap className="h-8 w-8" />;
    } else if (name.includes('pro') || name.includes('professional') || name.includes('premium')) {
      return <Star className="h-8 w-8" />;
    } else if (name.includes('enterprise') || name.includes('business')) {
      return <Crown className="h-8 w-8" />;
    }
    return <Sparkles className="h-8 w-8" />;
  };

  // Enhanced plan color scheme with gradients
  const getPlanColorScheme = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('starter') || name.includes('free')) {
      return {
        gradient: "from-blue-500 via-blue-600 to-blue-700",
        lightGradient: "from-blue-50 to-blue-100",
        darkGradient: "from-blue-950/50 to-blue-900/50",
        accent: "blue",
        ring: "ring-blue-500/20",
        popular: false
      };
    } else if (name.includes('pro') || name.includes('professional') || name.includes('premium')) {
      return {
        gradient: "from-purple-500 via-purple-600 to-purple-700",
        lightGradient: "from-purple-50 to-purple-100",
        darkGradient: "from-purple-950/50 to-purple-900/50",
        accent: "purple",
        ring: "ring-purple-500/20",
        popular: true
      };
    } else if (name.includes('enterprise') || name.includes('business')) {
      return {
        gradient: "from-amber-500 via-amber-600 to-amber-700",
        lightGradient: "from-amber-50 to-amber-100",
        darkGradient: "from-amber-950/50 to-amber-900/50",
        accent: "amber",
        ring: "ring-amber-500/20",
        popular: false
      };
    }
    return {
      gradient: "from-gray-500 via-gray-600 to-gray-700",
      lightGradient: "from-gray-50 to-gray-100",
      darkGradient: "from-gray-950/50 to-gray-900/50",
      accent: "gray",
      ring: "ring-gray-500/20",
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
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 to-transparent"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Loading Plans</p>
            <p className="text-muted-foreground">Finding the perfect plan for you...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="relative space-y-16 py-16">
        {showTitle && (
          <div className="text-center space-y-8 max-w-4xl mx-auto px-4">
            {/* Main Heading */}
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm font-medium text-primary">Choose Your Plan</span>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-bold">
                <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
                  Simple,
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                  Transparent Pricing
                </span>
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Choose the perfect plan for your business needs. Upgrade or downgrade at any time with no hidden fees.
              </p>
            </div>

            {/* Features Banner */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative bg-muted/50 backdrop-blur-sm p-1 rounded-2xl border border-border/50 shadow-lg">
            <div className="flex space-x-1">
              <button
                onClick={() => setSelectedBillingCycle('monthly')}
                className={`relative px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  selectedBillingCycle === 'monthly'
                    ? 'bg-background text-foreground shadow-lg ring-2 ring-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
                {selectedBillingCycle === 'monthly' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl" />
                )}
              </button>
              <button
                onClick={() => setSelectedBillingCycle('yearly')}
                className={`relative px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  selectedBillingCycle === 'yearly'
                    ? 'bg-background text-foreground shadow-lg ring-2 ring-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Yearly
                {selectedBillingCycle === 'yearly' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl" />
                )}
                <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-1">
                  Save 17%
                </Badge>
              </button>
            </div>
          </div>
          
          {selectedBillingCycle === 'yearly' && (
            <p className="text-center text-green-600 dark:text-green-400 font-medium animate-in fade-in duration-300">
              🎉 Save 2 months with annual billing
            </p>
          )}
        </div>        {/* Plans Grid */}
        {currentPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
            {currentPlans.map((plan) => {
              const colorScheme = getPlanColorScheme(plan.name);
              const isPurchasing = purchasing === plan.id;
              const isYearly = selectedBillingCycle === 'yearly';
              const monthlyEquivalent = isYearly ? plan.priceNumber / 12 : plan.priceNumber;
              
              return (
                <div 
                  key={plan.id} 
                  className={`relative group ${colorScheme.popular ? 'scale-105 z-10' : ''}`}
                >
                  {/* Popular Badge */}
                  {colorScheme.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Yearly Discount Badge */}
                  {isYearly && !colorScheme.popular && (
                    <div className="absolute -top-3 -right-3 z-20">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transform rotate-12">
                        SAVE 17%
                      </div>
                    </div>
                  )}
                  
                  <Card className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl backdrop-blur-sm border-0 ${
                    colorScheme.popular 
                      ? `bg-gradient-to-br from-background via-${colorScheme.accent}-50/10 to-${colorScheme.accent}-100/20 dark:from-background dark:via-${colorScheme.accent}-950/10 dark:to-${colorScheme.accent}-900/20 ring-2 ring-primary/20 shadow-xl`
                      : `bg-background/80 hover:bg-gradient-to-br hover:from-background hover:via-${colorScheme.accent}-50/5 hover:to-${colorScheme.accent}-100/10 dark:hover:from-background dark:hover:via-${colorScheme.accent}-950/5 dark:hover:to-${colorScheme.accent}-900/10 border border-border/50 hover:border-${colorScheme.accent}-200/50 dark:hover:border-${colorScheme.accent}-800/50`
                  } group-hover:scale-105 group-hover:-translate-y-2`}>
                    
                    {/* Background Gradient Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.lightGradient} dark:${colorScheme.darkGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    <CardHeader className="relative text-center pb-8 pt-12">
                      {/* Icon */}
                      <div className={`mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br ${colorScheme.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <div className="text-white">
                          {getPlanIcon(plan.name)}
                        </div>
                      </div>
                      
                      {/* Plan Name */}
                      <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                      
                      {/* Billing Badge */}
                      <Badge className={`mx-auto bg-${colorScheme.accent}-100 text-${colorScheme.accent}-800 dark:bg-${colorScheme.accent}-900/30 dark:text-${colorScheme.accent}-300 border-${colorScheme.accent}-200 dark:border-${colorScheme.accent}-800`}>
                        {isYearly ? 'Annual Billing' : 'Monthly Billing'}
                      </Badge>
                    </CardHeader>
                    
                    <CardContent className="relative text-center space-y-8 px-8 pb-8">
                      {/* Pricing */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-baseline justify-center space-x-2">
                            <span className="text-sm text-muted-foreground line-through">
                              {isYearly && `$${(plan.priceNumber * 1.2).toFixed(0)}`}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-center space-x-1">
                            <span className="text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                              ${plan.priceNumber}
                            </span>
                            <span className="text-xl text-muted-foreground font-medium">
                              /{isYearly ? 'year' : 'month'}
                            </span>
                          </div>
                          {isYearly && (
                            <div className="text-muted-foreground">
                              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                ${monthlyEquivalent.toFixed(2)}/month
                              </span>
                              <span className="text-sm ml-1">billed annually</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Description */}
                        {plan.description && (
                          <p className="text-muted-foreground leading-relaxed text-lg">
                            {plan.description}
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      <div className="space-y-4 text-left">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3 group/feature">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`p-1.5 rounded-full bg-gradient-to-r ${colorScheme.gradient} shadow-sm group-hover/feature:scale-110 transition-transform duration-200`}>
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            </div>
                            <span className="text-foreground group-hover/feature:text-foreground/80 transition-colors text-base leading-relaxed">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <Button
                        className={`w-full py-6 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-white border-0 group/button relative overflow-hidden ${
                          colorScheme.popular
                            ? 'bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:to-secondary/90'
                            : `bg-gradient-to-r ${colorScheme.gradient} hover:opacity-90`
                        }`}
                        onClick={() => handlePurchasePlan(plan.id)}
                        disabled={isPurchasing}
                      >
                        {/* Button Background Effect */}
                        <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover/button:scale-x-100 transition-transform duration-300 origin-left" />
                        
                        <div className="relative flex items-center justify-center space-x-2">
                          {isPurchasing ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                              <span>Activating...</span>
                            </>
                          ) : (
                            <>
                              {colorScheme.popular && <Crown className="h-5 w-5" />}
                              <span>Get Started</span>
                              <ArrowRight className="h-5 w-5 transition-transform group-hover/button:translate-x-1" />
                            </>
                          )}
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Building className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No Plans Available</h3>
              <p className="text-muted-foreground">Check back later for subscription options.</p>
            </div>
          </div>
        )}
        
        {/* Bottom CTA Section */}
        <div className="text-center space-y-8 max-w-3xl mx-auto px-4">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 border border-primary/10 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Rocket className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-bold">Ready to get started?</h3>
              </div>
              <p className="text-muted-foreground text-lg">
                Join thousands of businesses already using our platform to scale their operations.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
                <div className="flex items-center space-x-2">
                  <Infinity className="h-4 w-4 text-blue-500" />
                  <span>Unlimited scalability</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Enterprise security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Expert support team</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
