"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MobileInputModal } from '@/components/ui/mobile-input-modal';
import { 
  Check, 
  Crown, 
  Zap,
  Star,
  ArrowRight,
  CheckCircle
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
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
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

    loadPlans();
  }, [toast]);  // Handle plan purchase with PhonePe
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
    
    setSelectedPlan(plan);
    setShowMobileModal(true);
  };
  // Handle mobile number submission
  const handleMobileSubmit = async (mobileNumber: string) => {
    if (!selectedPlan) return;
    
    setPurchasing(selectedPlan.id);
    
    try {
      // Use the new enhanced create-order endpoint that supports both payment types
      const response = await fetch('/api/payments/phonepe/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({ 
          planId: selectedPlan.id,
          mobileNumber,
          paymentType: 'subscription'
        }),
      });

      const data = await response.json();      if (data.success) {
        // Close modal
        setShowMobileModal(false);

        // Check if we got subscription setup or standard payment (fallback)
        if (data.data.subscriptionSetupUrl && data.data.accessToken) {
          // Show success message for subscription
          toast({
            title: "Redirecting to Payment",
            description: `You will be redirected to PhonePe for subscription setup...`,
          });

          // For subscription flow, redirect to PhonePe with OAuth headers
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.data.subscriptionSetupUrl;
          
          // Add subscription payload
          const payloadInput = document.createElement('input');
          payloadInput.type = 'hidden';
          payloadInput.name = 'request';
          payloadInput.value = JSON.stringify(data.data.payload);
          form.appendChild(payloadInput);
          
          // Add authorization header if provided
          const authInput = document.createElement('input');
          authInput.type = 'hidden';
          authInput.name = 'Authorization';
          authInput.value = `O-Bearer ${data.data.accessToken}`;
          form.appendChild(authInput);
          
          console.log('Submitting subscription setup to PhonePe:', {
            url: form.action,
            payload: data.data.payload,
            hasAuth: !!data.data.accessToken
          });
          
          document.body.appendChild(form);
          form.submit();
            } else if (data.data.paymentUrl && data.data.payload && data.data.xVerify) {
          // Fallback to standard payment
          toast({
            title: "Payment Method Updated",
            description: `Using standard payment method. You'll need to manually renew when your subscription expires.`,
            variant: "default"
          });

          // For standard payment flow, create form and submit to PhonePe
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.data.paymentUrl;
          form.enctype = 'application/x-www-form-urlencoded';
          
          // Add payload and X-VERIFY header as form fields
          const payloadInput = document.createElement('input');
          payloadInput.type = 'hidden';
          payloadInput.name = 'request';
          payloadInput.value = data.data.payload;
          form.appendChild(payloadInput);
          
          const xVerifyInput = document.createElement('input');
          xVerifyInput.type = 'hidden';
          xVerifyInput.name = 'X-VERIFY';
          xVerifyInput.value = data.data.xVerify;
          form.appendChild(xVerifyInput);
          
          console.log('Submitting standard payment to PhonePe:', {
            url: form.action,
            payload: payloadInput.value,
            xVerify: xVerifyInput.value
          });
          
          document.body.appendChild(form);
          form.submit();
        } else {
          throw new Error('Invalid payment response format');
        }

        // Call the callback if provided
        if (onPlanSelected) {
          onPlanSelected(selectedPlan.id);
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
        description: "Failed to purchase subscription",
        variant: "destructive"
      });
    } finally {
      setPurchasing(null);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowMobileModal(false);
    setSelectedPlan(null);
    setPurchasing(null);
  };

  // Get plan icon
  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('free')) {
      return <Zap className="h-6 w-6" />;
    } else if (name.includes('pro') || name.includes('premium')) {
      return <Star className="h-6 w-6" />;
    } else if (name.includes('enterprise') || name.includes('business')) {
      return <Crown className="h-6 w-6" />;
    }
    return <Zap className="h-6 w-6" />;
  };

  // Get plan color scheme
  const getPlanColorScheme = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('free')) {
      return {
        iconColor: "from-blue-500 to-blue-600",
        badgeColor: "bg-blue-100 text-blue-800",
        buttonColor: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      };
    } else if (name.includes('pro') || name.includes('premium')) {
      return {
        iconColor: "from-purple-500 to-purple-600",
        badgeColor: "bg-purple-100 text-purple-800",
        buttonColor: "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
      };
    } else if (name.includes('enterprise') || name.includes('business')) {
      return {
        iconColor: "from-amber-500 to-amber-600",
        badgeColor: "bg-amber-100 text-amber-800",
        buttonColor: "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
      };
    }
    return {
      iconColor: "from-gray-500 to-gray-600",
      badgeColor: "bg-gray-100 text-gray-800",
      buttonColor: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
    };
  };

  // Group plans by billing cycle
  const monthlyPlans = plans.filter(plan => plan.billingCycle === 'monthly');
  const yearlyPlans = plans.filter(plan => plan.billingCycle === 'yearly');
  
  // Get current plans based on selected tab
  const currentPlans = selectedBillingCycle === 'monthly' ? monthlyPlans : yearlyPlans;

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-12 ${className}`}>
      {showTitle && (
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Choose your plan
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Get the right plan for your business. Plans can be upgraded in the future.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>14 days free trial</span>
          </div>
        </div>
      )}      {/* Billing Cycle Tabs */}
      <div className="flex items-center justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner">
          <div className="flex space-x-1">
            <button
              onClick={() => setSelectedBillingCycle('monthly')}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                selectedBillingCycle === 'monthly'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedBillingCycle('yearly')}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 relative ${
                selectedBillingCycle === 'yearly'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>      {/* Subscription Info Banner */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Smart Payment System:</strong> We'll attempt automatic recurring billing first. If unavailable, you'll get standard payment with manual renewal options.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      {currentPlans.length > 0 ? (
        <div className="mx-auto max-w-md gap-6 px-4">
          {currentPlans.map((plan) => {
            const colorScheme = getPlanColorScheme(plan.name);
            const isPurchasing = purchasing === plan.id;
            const isYearly = selectedBillingCycle === 'yearly';
            const monthlyEquivalent = isYearly ? plan.priceNumber / 12 : plan.priceNumber;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg backdrop-blur-sm ${
                  isYearly 
                    ? 'border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 dark:from-gray-800 dark:via-green-900/10 dark:to-emerald-900/5'
                    : 'border-0 bg-white dark:bg-gray-800/50'
                }`}
              >
                {/* Best Value Badge for Yearly */}
                {isYearly && (
                  <div className="absolute -top-0 -right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 text-xs font-bold transform rotate-12 translate-x-4 -translate-y-2 shadow-lg">
                    SAVE 17%
                  </div>
                )}
                
                <CardHeader className="text-center pb-6 pt-8">
                  <div className={`mx-auto mb-6 p-3 rounded-2xl shadow-lg ${
                    isYearly 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                      : `bg-gradient-to-br ${colorScheme.iconColor}`
                  }`}>
                    <div className="text-white">
                      {getPlanIcon(plan.name)}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <Badge className={`mx-auto ${
                    isYearly 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  }`}>
                    {isYearly ? 'Annual Billing' : 'Monthly Billing'}
                  </Badge>
                  {isYearly && (
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      2 months free included
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="text-center space-y-8 px-6 pb-8">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-center space-x-1">
                        <span className={`text-5xl font-bold bg-clip-text text-transparent ${
                          isYearly 
                            ? 'bg-gradient-to-r from-green-700 to-emerald-600 dark:from-green-400 dark:to-emerald-300'
                            : 'bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300'
                        }`}>
                          ${plan.priceNumber}
                        </span>
                        <span className="text-lg text-muted-foreground font-medium">
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
                    {plan.description && (
                      <p className="text-muted-foreground leading-relaxed">{plan.description}</p>
                    )}
                  </div>

                  <div className="space-y-4 text-left">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3 group">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`p-1 rounded-full ${
                            isYearly 
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-green-50 dark:bg-green-900/20'
                          }`}>
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full py-6 text-base font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-white border-0 group ${
                      isYearly 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : colorScheme.buttonColor
                    }`}
                    onClick={() => handlePurchasePlan(plan.id)}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {isYearly && <Crown className="h-5 w-5" />}
                        <span>Get Plan</span>
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No subscription plans available at the moment.</p>
        </div>
      )}

      {/* Mobile Number Input Modal */}
      <MobileInputModal
        isOpen={showMobileModal}
        onClose={handleModalClose}
        onSubmit={handleMobileSubmit}
        planName={selectedPlan?.name}
        planPrice={selectedPlan?.price}
        isLoading={purchasing !== null}
      />
    </div>
  );
}
