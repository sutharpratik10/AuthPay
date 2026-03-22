"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { APP_CONFIG } from "@/lib/utils/constants";
import {
  Check,
  Crown,
  Star,
  ArrowRight,
  Sparkles,
  Building2,
  TrendingUp,
  Users,
  Rocket,
  Zap,
  Shield,
  Clock,
  DollarSign,
  Target,
  Loader2,
} from "lucide-react";

interface RazorpayPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: number;
  period: string;
  features: string[];
  razorpayPlanId: string | null;
  razorpayItemId: string | null;
  dbPlanId?: string;
  isActive: boolean;
  createdAt: number;
  planType: 'subscription' | 'basic' | 'stripe-subscription';
  badge?: string;
  stripeProductId?: string | null;
}

interface PricingPageProps {
  onPlanSelected?: (planId: string) => void;
}

export default function PricingPage({ onPlanSelected }: PricingPageProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [plans, setPlans] = useState<RazorpayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscription-plans/visible");
      if (response.ok) {
        const data = await response.json();
        if (data?.success) {
          console.log("[PricingPage] Loaded plans:", data.plans);
          setPlans(data.plans || []);
        } else {
          toast({
            title: "Error",
            description: "Failed to load subscription plans",
            variant: "destructive",
          });
        }
      } else {
        throw new Error("Failed to fetch plans");
      }
    } catch (error) {
      console.error("[PricingPage] Error loading plans:", error);
      toast({
        title: "Error",
        description: "Could not load pricing information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    // Razorpay stores amount in smallest currency unit (paise for INR, cents for USD)
    const actualAmount = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(actualAmount);
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('enterprise') || name.includes('premium')) return Crown;
    if (name.includes('pro') || name.includes('professional')) return Rocket;
    return Building2;
  };

  const isPlanPopular = (index: number) => {
    // Mark the middle plan as popular if there are 3 plans
    return plans.length === 3 && index === 1;
  };

  // Filter plans by billing cycle
  const filteredPlans = plans.filter(plan => {
    if (billingCycle === "monthly") {
      return plan.period === "monthly";
    } else {
      return plan.period === "yearly";
    }
  });

  const savings = billingCycle === "yearly" ? 17 : 0;

  // Handle purchase with Razorpay checkout
  const handlePurchase = async (plan: RazorpayPlan) => {
    if (purchasing) return;

    setPurchasing(plan.id);

    try {
      // For subscription plans (Razorpay), create a subscription and open checkout
      if (plan.planType === 'subscription' && plan.razorpayPlanId) {
        // Step 1: Create a Razorpay subscription
        const createRes = await fetch('/api/payments/razorpay-subscriptions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayPlanId: plan.razorpayPlanId,
            total_count: plan.period === 'yearly' ? 1 : 12, // 1 year or 12 months
          }),
        });

        const createData = await createRes.json();

        if (!createRes.ok || !createData.success || !createData.subscription) {
          throw new Error(createData.error || 'Failed to create subscription');
        }

        const subscription = createData.subscription;

        // Step 2: Open Razorpay checkout
        const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKeyId) {
          throw new Error('Razorpay key not configured');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Razorpay = (window as any).Razorpay;
        if (!Razorpay) {
          throw new Error('Razorpay SDK not loaded');
        }

        const options = {
          key: razorpayKeyId,
          subscription_id: subscription.id,
          name: APP_CONFIG.APP_NAME,
          description: `${plan.name} - ${plan.period === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handler: async function (response: any) {
            try {
              // Step 3: Record the purchase in the database
              const purchaseRes = await fetch('/api/subscription-plans/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  planId: plan.dbPlanId || plan.id,
                  payment: {
                    provider: 'razorpay',
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySubscriptionId: response.razorpay_subscription_id,
                    razorpaySignature: response.razorpay_signature,
                  },
                }),
              });

              const purchaseData = await purchaseRes.json();

              if (purchaseRes.ok && purchaseData.success) {
                toast({
                  title: 'Success!',
                  description: `You have successfully subscribed to ${plan.name}`,
                  variant: 'success',
                });

                // Refresh subscription context
                refreshSubscription();

                // Call onPlanSelected if provided
                if (onPlanSelected) {
                  onPlanSelected(plan.razorpayPlanId || plan.id);
                }
              } else {
                throw new Error(purchaseData.error || 'Failed to record purchase');
              }
            } catch (error) {
              console.error('Purchase recording failed:', error);
              toast({
                title: 'Payment Received',
                description: 'Payment was successful but there was an issue recording it. Please contact support.',
                variant: 'destructive',
              });
            } finally {
              setPurchasing(null);
            }
          },
          prefill: {
            // These can be populated from user context if available
          },
          theme: {
            color: '#1e293b', // slate-800
          },
          modal: {
            ondismiss: function () {
              setPurchasing(null);
            },
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();

      } else if (plan.planType === 'stripe-subscription' || plan.stripeProductId) {
        // For Stripe subscriptions
        const billingInterval = plan.period === 'yearly' || plan.period === 'year' ? 'year' : 'month';
        
        const resp = await fetch("/api/payments/stripe-create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: plan.amount / 100, // Converts cents back to dollars for API expectation
            currency: plan.currency || "USD",
            planId: plan.id,
            planName: plan.name,
            billingInterval,
            mode: "subscription",
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create Stripe session");
        }

        const data = await resp.json();
        if (!data.checkoutUrl) throw new Error("No checkout URL returned from Stripe");

        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        // For basic plans (one-time payment)

        // Step 1: Create a Razorpay Order
        // Note: API expects amount in major units (e.g., 999 for ₹999), but plan.amount is in paise
        const orderRes = await fetch('/api/payments/razorpay-create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: plan.amount / 100, // Convert paise to rupees (major units)
            currency: plan.currency,
            planId: plan.dbPlanId || plan.id,
          }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok || !orderData.success || !orderData.order) {
          throw new Error(orderData.error || 'Failed to create payment order');
        }

        const order = orderData.order;

        // Step 2: Open Razorpay checkout with Order ID
        const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKeyId) {
          throw new Error('Razorpay key not configured');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Razorpay = (window as any).Razorpay;
        if (!Razorpay) {
          throw new Error('Razorpay SDK not loaded');
        }

        const options = {
          key: razorpayKeyId,
          amount: plan.amount, // Razorpay SDK expects amount in paise (minor units)
          currency: plan.currency,
          name: APP_CONFIG.APP_NAME,
          description: `${plan.name} - One-Time Payment`,
          order_id: order.id, // Pass the Order ID created on backend
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handler: async function (response: any) {
            try {
              // Step 3: Record the purchase in the database
              const purchaseRes = await fetch('/api/subscription-plans/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  planId: plan.dbPlanId || plan.id,
                  payment: {
                    provider: 'razorpay',
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature,
                  },
                }),
              });

              const purchaseData = await purchaseRes.json();

              if (purchaseRes.ok && purchaseData.success) {
                toast({
                  title: 'Success!',
                  description: `You have successfully purchased ${plan.name}`,
                  variant: 'success',
                });

                // Refresh subscription context
                refreshSubscription();

                // Call onPlanSelected if provided
                if (onPlanSelected) {
                  onPlanSelected(plan.dbPlanId || plan.id);
                }
              } else {
                throw new Error(purchaseData.error || 'Failed to verify payment');
              }
            } catch (error) {
              console.error('Purchase verification failed:', error);
              toast({
                title: 'Payment Received',
                description: 'Payment was successful but there was an issue verifying it. Please contact support.',
                variant: 'destructive',
              });
            } finally {
              setPurchasing(null);
            }
          },
          prefill: {
            // These can be populated from user context if available
          },
          theme: {
            color: '#1e293b', // slate-800
          },
          modal: {
            ondismiss: function () {
              setPurchasing(null);
            },
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process purchase',
        variant: 'destructive',
      });
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* Success Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 bg-card backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500" />
              <span className="text-sm font-semibold text-foreground">200% Average Growth</span>
            </div>
            <div className="flex items-center gap-2 bg-card backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              <span className="text-sm font-semibold text-foreground">10,000+ Happy Clients</span>
            </div>
            <div className="flex items-center gap-2 bg-card backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border">
              <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <span className="text-sm font-semibold text-foreground">4.9/5 Rating</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              <Sparkles className="h-4 w-4" />
              Transform Your Business Today
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Grow Your Business
              </span>
              <br />
              <span className="text-foreground">
                3x Faster with AuthPay
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join thousands of successful businesses using our powerful booking system.
              <span className="font-semibold text-foreground"> Increase bookings by 200%</span>,
              reduce no-shows by <span className="font-semibold text-foreground">80%</span>,
              and save <span className="font-semibold text-foreground">15 hours per week</span>.
            </p>

            {/* Social Proof */}
            <div className="flex flex-col items-center gap-3 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 border-2 border-background flex items-center justify-center text-primary-foreground font-bold text-sm"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">2,547</span> businesses joined this week
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-16">
          <div className="relative inline-flex bg-card rounded-2xl p-2 shadow-xl border border-border">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${billingCycle === "monthly"
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${billingCycle === "yearly"
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Yearly
              <span className="absolute -top-3 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Save {savings}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              No subscription plans available at the moment.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto items-stretch">
            {filteredPlans.map((plan, index) => {
              const Icon = getPlanIcon(plan.name);
              const badge = plan.badge;
              const isPopular = badge === "Most Popular";
              const yearlyAmount = plan.amount / 100; // Full amount in major currency unit
              const displayPrice = plan.period === "yearly"
                ? yearlyAmount / 12  // Show monthly equivalent for yearly plans
                : yearlyAmount;      // Show actual price for monthly plans

              return (
                <div
                  key={plan.id}
                  className="relative h-full w-full md:w-[350px] lg:w-[380px]"
                >
                  {badge && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 w-max">
                      <div className={`
                        ${isPopular
                          ? "bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-500 dark:to-amber-600 shadow-amber-500/20"
                          : "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-500/20"
                        } 
                        text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2
                      `}>
                        {isPopular && <Star className="h-4 w-4 fill-current" />}
                        {badge}
                      </div>
                    </div>
                  )}

                  <Card className={`relative overflow-hidden border-2 transition-all duration-300 h-full ${isPopular
                    ? "border-primary shadow-2xl scale-105 z-10"
                    : "border-border hover:border-primary hover:shadow-xl"
                    } bg-card`}>
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/20 dark:to-transparent" />

                    <CardContent className="relative p-8 flex flex-col h-full">
                      {/* Plan Header */}
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-500 dark:from-slate-400 dark:to-slate-500 flex items-center justify-center shadow-lg">
                          <Icon className="h-8 w-8 text-white" />
                        </div>

                        <div>
                          <h3 className="text-2xl font-bold text-foreground">
                            {plan.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {plan.description || `Perfect for your business needs`}
                          </p>
                        </div>

                        {/* Billing Period Badge */}
                        <Badge className="bg-gradient-to-r from-slate-600 to-slate-500 dark:from-slate-400 dark:to-slate-500 text-white border-0 px-4 py-1">
                          {plan.planType === 'basic'
                            ? 'One-Time Payment'
                            : plan.period === "monthly" ? "Monthly Billing" : "Yearly Billing"}
                        </Badge>
                      </div>

                      {/* Pricing */}
                      <div className="text-center space-y-2 py-6">
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-muted-foreground">{plan.currency === "INR" ? "₹" : "$"}</span>
                          <span className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                            {displayPrice.toFixed(2)}
                          </span>
                          {plan.planType === 'basic' ? (
                            <span className="text-muted-foreground">one-time</span>
                          ) : (
                            <span className="text-muted-foreground">/month</span>
                          )}
                        </div>

                        {plan.planType === 'subscription' && plan.period === "yearly" && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(plan.amount, plan.currency)} billed annually
                            </p>
                          </div>
                        )}

                        {plan.planType === 'basic' && (
                          <p className="text-sm text-green-600 dark:text-green-500 font-medium">
                            No recurring charges
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-6 flex-grow">
                        {plan.features && plan.features.length > 0 ? (
                          plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <Check className="h-5 w-5 mt-0.5 shrink-0 text-slate-600 dark:text-slate-400" />
                              <span className="text-sm text-foreground/80">
                                {feature}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-muted-foreground italic">
                            Contact us for feature details
                          </li>
                        )}
                      </ul>

                      {/* CTA Button */}
                      <div className="space-y-3 mt-auto">
                        <Button
                          className={`w-full py-6 text-base font-semibold rounded-xl transition-all duration-300 ${isPopular
                            ? "bg-gradient-to-r from-stone-700 to-stone-600 dark:from-stone-600 dark:to-stone-700 hover:from-stone-800 hover:to-stone-700 dark:hover:from-stone-500 dark:hover:to-stone-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                            : "bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-600 dark:to-slate-700 hover:from-slate-800 hover:to-slate-700 dark:hover:from-slate-500 dark:hover:to-slate-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                            }`}
                          disabled={!!purchasing}
                          onClick={() => handlePurchase(plan)}
                        >
                          {purchasing === plan.id ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Rocket className="h-5 w-5 mr-2" />
                              Start Growing Now
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Benefits Section */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Businesses Love AuthPay
            </h2>
            <p className="text-lg text-muted-foreground">
              Real results from real businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "200% More Bookings",
                description: "Automated reminders and easy online booking increase your bookings dramatically",
                iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
                iconColor: "text-emerald-700 dark:text-emerald-400",
              },
              {
                icon: Clock,
                title: "Save 15 Hours/Week",
                description: "Automate scheduling, reminders, and customer management",
                iconBg: "bg-sky-100 dark:bg-sky-900/30",
                iconColor: "text-sky-700 dark:text-sky-400",
              },
              {
                icon: DollarSign,
                title: "Increase Revenue by 150%",
                description: "Accept online payments and reduce no-shows by 80%",
                iconBg: "bg-amber-100 dark:bg-amber-900/30",
                iconColor: "text-amber-700 dark:text-amber-400",
              },
            ].map((benefit, index) => {
              const BenefitIcon = benefit.icon;
              return (
                <Card key={index} className="border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-xl bg-card">
                  <CardContent className="p-8 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl ${benefit.iconBg} flex items-center justify-center shadow-sm`}>
                      <BenefitIcon className={`h-7 w-7 ${benefit.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Success Stories
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: "Sarah Johnson",
                business: "Zen Yoga Studio",
                quote: "AuthPay transformed my business! I went from 20 bookings a week to 60. The automated reminders alone saved me hours.",
                growth: "+200% bookings",
              },
              {
                name: "Michael Chen",
                business: "Elite Fitness",
                quote: "Managing 3 locations was a nightmare until AuthPay. Now everything is automated and my revenue increased by 150%.",
                growth: "+150% revenue",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="border-2 border-border bg-card">
                <CardContent className="p-8 space-y-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground/80 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="font-semibold text-foreground">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.business}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">
                      {testimonial.growth}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-24 text-center max-w-3xl mx-auto">
          <Card className="border-2 border-border bg-muted/30 shadow-xl">
            <CardContent className="p-12 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Target className="h-8 w-8 text-slate-700 dark:text-slate-300" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join 10,000+ successful businesses. Start your 30-day risk-free trial today.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-600 dark:to-slate-700 hover:from-slate-800 hover:to-slate-700 dark:hover:from-slate-500 dark:hover:to-slate-600 text-white text-lg px-12 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Your Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-sm text-muted-foreground">
                No credit card required • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
