// SubscriptionPlansSelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { usePaymentGateway } from "@/hooks/use-payment-gateway";
import {
  Check,
  Crown,
  Zap,
  Star,
  ArrowRight,
  Sparkles,
  Building,
} from "lucide-react";
import { SubscriptionPlan } from '@/types/subscription-plans';

// ---------- Razorpay minimal typings ----------
type SubscriptionHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount?: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  order_id?: string;
  subscription_id?: string;
  handler: (response: SubscriptionHandlerResponse) => void;
  prefill?: Record<string, unknown>;
  theme?: { color?: string };
};

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (arg: unknown) => void) => void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}
// ---------------------------------------------

interface SubscriptionPlansProps {
  onPlanSelected?: (planId: string) => void;
  showTitle?: boolean;
  className?: string;
  lazyLoad?: boolean; // New prop to enable lazy loading
}

export default function SubscriptionPlansSelector({
  onPlanSelected,
  showTitle = true,
  className = "",
  lazyLoad = true, // Default to true to avoid unnecessary fetches
}: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] =
    useState<"monthly" | "yearly">("yearly");
  const [isVisible, setIsVisible] = useState(!lazyLoad); // If not lazy loading, start as visible
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { refreshSubscription } = useSubscription();
  const { gateway } = usePaymentGateway();

  const isRazorpayLoaded = () =>
    typeof window !== "undefined" && typeof window.Razorpay === "function";

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || isVisible) return;

    const currentRef = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [lazyLoad, isVisible]);

  // Load subscription plans only when visible
  useEffect(() => {
    if (!isVisible) return;

    const loadPlans = async () => {
      try {
        // Fetch both local plans and Razorpay plans in parallel for faster loading
        const [localResponse, razorpayResponse] = await Promise.allSettled([
          fetch("/api/subscription-plans"),
          fetch('/api/payments/razorpay-plans?count=100')
        ]);

        // Process local plans
        let localPlans: SubscriptionPlan[] = [];
        if (localResponse.status === 'fulfilled' && localResponse.value.ok) {
          const data = await localResponse.value.json();
          if (data?.success) {
            localPlans = data.data.plans as SubscriptionPlan[];
          }
        }

        // Process Razorpay plans
        let razorpayPlans: SubscriptionPlan[] = [];
        if (razorpayResponse.status === 'fulfilled' && razorpayResponse.value.ok) {
          try {
            const rpJson = await razorpayResponse.value.json();
            // Razorpay SDK returns an object with `items` array
            const items = rpJson.items || rpJson.subscriptions || rpJson.plans || rpJson;
            if (Array.isArray(items)) {
              razorpayPlans = items.map((r: unknown) => {
                const rz = r as Record<string, unknown>;
                const item = rz.item as Record<string, unknown> | undefined;
                const amountRaw = item?.amount ?? item?.unit_amount ?? 0;
                const amountNum = typeof amountRaw === 'string' ? parseInt(amountRaw, 10) : Number(amountRaw || 0);
                const rupees = Number.isFinite(amountNum) ? amountNum / 100 : 0;
                const billingCycle = String(rz.period || '').toLowerCase() || 'monthly';
                const idStr = String(rz.id || '');

                return {
                  id: `rz-${idStr}`,
                  name: String(item?.name || `Razorpay ${billingCycle} plan`),
                  description: item?.description ? String(item.description) : null,
                  price: `${String((item?.currency || 'INR')).toUpperCase()} ${rupees.toFixed(2)}`,
                  billingCycle,
                  features: rz.notes ? [JSON.stringify(rz.notes)] : [],
                  isActive: Boolean(item?.active),
                  razorpaySubscriptionId: null,
                  razorpaySubscriptionPlanId: idStr,
                  razorpaySubscriptionLink: `https://dashboard.razorpay.com/plans/${idStr}`,
                  createdAt: new Date((Number(rz.created_at) || Date.now()) * 1000).toISOString(),
                  updatedAt: new Date().toISOString(),
                  priceNumber: rupees,
                  formattedPrice: rupees ? `₹${rupees.toFixed(2)}` : '₹0.00',
                  canPurchase: true,
                } as SubscriptionPlan;
              });
            }
          } catch (err) {
            console.warn('Failed to parse Razorpay plans:', err);
          }
        }

        // Merge local plans + razorpay plans (local first)
        setPlans([...localPlans, ...razorpayPlans]);
      } catch (error) {
        console.error("Error loading plans:", error);
        toast({
          title: "Error",
          description: "Failed to load subscription plans",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [toast, isVisible]);

  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const handleBuyWithRazorpay = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      toast({
        title: "Error",
        description: "Plan not found",
        variant: "destructive",
      });
      return;
    }

    setPurchasing(planId);

    try {
      // 1) Create subscription on backend (server will call Razorpay subscriptions.create)
      const createBody: Record<string, unknown> = { planId: plan.id };
  const p = plan as Partial<SubscriptionPlan>;
  if (p.razorpaySubscriptionPlanId) createBody.razorpayPlanId = p.razorpaySubscriptionPlanId;

      const subResp = await fetch("/api/payments/razorpay-subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      });

      if (!subResp.ok) {
        const err = (await subResp.json().catch(() => ({}))) as { error?: string };
        throw new Error(err?.error || "Failed to create subscription");
      }

      const subData = await subResp.json();
      const subscription = subData.subscription;
      if (!subscription?.id) throw new Error("Invalid subscription returned from server");

      // 2) Ensure Razorpay script is loaded
      if (!isRazorpayLoaded()) {
        toast({ title: "Loading payment gateway..." });
        let loaded = false;
        for (let i = 0; i < 20; i++) {
          if (isRazorpayLoaded()) {
            loaded = true;
            break;
          }
          // ~4s total
          await wait(200);
        }
        if (!loaded) {
          throw new Error("Payment gateway failed to load. Try again later.");
        }
      }

      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!key) {
        throw new Error(
          "Razorpay key is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID."
        );
      }

      const Razorpay = window.Razorpay as RazorpayConstructor;

      const options: RazorpayOptions = {
        key,
        name: plan.name,
        description: plan.description || "",
        subscription_id: subscription.id,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id?: string;
          razorpay_signature: string;
        }) => {
          try {
            const purchaseResponse = await fetch("/api/subscription-plans/purchase", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                planId: plan.id,
                payment: {
                  provider: "razorpay",
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySubscriptionId: response.razorpay_subscription_id || subscription.id,
                  razorpaySignature: response.razorpay_signature,
                },
              }),
            });

            if (!purchaseResponse.ok) {
              throw new Error("Failed to activate subscription");
            }

            // Show success message first
            toast({
              title: "Payment successful",
              description: `Activating your ${plan.name} subscription...`,
            });

            // Refresh subscription status to update the dashboard
            await refreshSubscription();

            // Update success message
            toast({
              title: "Subscription activated!",
              description: `Your ${plan.name} subscription is now active. Enjoy your premium features!`,
            });

            onPlanSelected?.(plan.id);
          } catch (err) {
            console.error("Post-payment error:", err);
            toast({
              title: "Error",
              description:
                "Payment succeeded but activating subscription failed. Contact support.",
              variant: "destructive",
            });
          } finally {
            setPurchasing(null);
          }
        },
        prefill: {},
        theme: { color: "#6366f1" },
      };

      const rzp = new Razorpay(options);
      rzp.open();

      // Optional event listener (typed as unknown)
      rzp.on("checkout.failed", (err: unknown) => {
        console.warn("Razorpay checkout failed event:", err);
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to process payment";
      console.error("Error purchasing plan with Razorpay:", error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setPurchasing(null);
    }
  };

  /** Stripe Checkout — redirects the user to Stripe's hosted payment page */
  const handleBuyWithStripe = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      toast({ title: "Error", description: "Plan not found", variant: "destructive" });
      return;
    }

    setPurchasing(planId);
    try {
      const billingInterval: "month" | "year" =
        selectedBillingCycle === "yearly" ? "year" : "month";

      const resp = await fetch("/api/payments/stripe-create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.priceNumber,
          currency: "USD",
          planId: plan.id.startsWith("rz-") ? null : plan.id,
          planName: plan.name,
          billingInterval,
          mode: "subscription",
        }),
      });

      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(err?.error || "Failed to create Stripe session");
      }

      const data = (await resp.json()) as { checkoutUrl?: string };
      if (!data.checkoutUrl) throw new Error("No checkout URL returned from Stripe");

      // Redirect to Stripe Checkout (hosted page)
      window.location.href = data.checkoutUrl;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to start Stripe checkout";
      console.error("Stripe checkout error:", error);
      toast({ title: "Error", description: message, variant: "destructive" });
      setPurchasing(null);
    }
  };

  /** Route to the correct payment gateway based on the visitor's country */
  const handlePurchasePlan = (planId: string) => {
    if (gateway === "razorpay") {
      return handleBuyWithRazorpay(planId);
    }
    return handleBuyWithStripe(planId);
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("basic") || name.includes("starter") || name.includes("free")) {
      return <Zap className="h-6 w-6 text-blue-500 dark:text-blue-400" />;
    } else if (name.includes("pro") || name.includes("professional") || name.includes("premium")) {
      return <Star className="h-6 w-6 text-purple-500 dark:text-purple-400" />;
    } else if (name.includes("enterprise") || name.includes("business")) {
      return <Crown className="h-6 w-6 text-amber-500 dark:text-amber-400" />;
    }
    return <Sparkles className="h-6 w-6 text-gray-500 dark:text-gray-400" />;
  };

  const getPlanColorScheme = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("basic") || name.includes("starter") || name.includes("free")) {
      return { accent: "blue", popular: false };
    } else if (name.includes("pro") || name.includes("professional") || name.includes("premium")) {
      return { accent: "purple", popular: true };
    } else if (name.includes("enterprise") || name.includes("business")) {
      return { accent: "amber", popular: false };
    }
    return { accent: "gray", popular: false };
  };

  const monthlyPlans = plans.filter((plan) => plan.billingCycle === "monthly");
  const yearlyPlans = plans.filter((plan) => plan.billingCycle === "yearly");
  const currentPlans =
    selectedBillingCycle === "monthly" ? monthlyPlans : yearlyPlans;

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
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Load Razorpay script only when needed */}
      {gateway === "razorpay" && (
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      )}
      <div className="relative space-y-10 py-10">
        {showTitle && (
          <div className="text-center space-y-4 max-w-2xl mx-auto px-2">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Choose Your Plan
            </h2>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-muted rounded-lg p-1 border border-border">
            <button
              onClick={() => setSelectedBillingCycle("monthly")}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBillingCycle === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedBillingCycle("yearly")}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBillingCycle === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              {selectedBillingCycle === "yearly" && (
                <span className="ml-2 text-green-600 dark:text-green-400 font-semibold text-xs">
                  Save 17%
                </span>
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
              const isYearly = selectedBillingCycle === "yearly";
              const monthlyEquivalent = isYearly
                ? plan.priceNumber / 12
                : plan.priceNumber;

              return (
                <div
                  key={plan.id}
                  className={`relative group w-full max-w-sm ${
                    colorScheme.popular ? "z-10" : ""
                  }`}
                >
                  {colorScheme.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold shadow">
                        Most Popular
                      </div>
                    </div>
                  )}
                  <Card className="relative border border-border bg-background/90 hover:bg-background transition-colors duration-200 shadow-sm group-hover:shadow-md">
                    <CardHeader className="relative text-center pb-4 pt-8">
                      <div className="mx-auto mb-3 flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                        {getPlanIcon(plan.name)}
                      </div>
                      <CardTitle className="text-lg font-semibold mb-1">
                        {plan.name}
                      </CardTitle>
                      <Badge
                        className={`mx-auto border-0 ${
                          colorScheme.accent === 'blue' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : colorScheme.accent === 'purple'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : colorScheme.accent === 'amber'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}
                      >
                        {isYearly ? "Annual" : "Monthly"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="relative text-center space-y-5 px-4 pb-6">
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold text-foreground">
                            ₹{monthlyEquivalent.toFixed(2)}/Mo
                          </span>
                        </div>
                         <span className="text-sm text-muted-foreground">
                           {isYearly ? "billed annually" : ""}
                          </span>
                        {isYearly && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            <span className=" font-bold text-foreground">
                            ₹{plan.priceNumber}
                          </span>
                          <span className="text-base text-muted-foreground font-medium">
                            /{isYearly ? "year" : "month"}
                          </span>
                          </div>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                      <ul className="space-y-2 text-left mt-2">
                        {plan.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-foreground text-sm"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full py-3 text-base font-medium rounded-lg mt-2 transition-all duration-200 ${
                          plan.priceNumber === 0
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 cursor-not-allowed"
                            : !plan.canPurchase
                            ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
                            : colorScheme.popular
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground hover:bg-muted/80"
                        } ${isPurchasing ? "opacity-70" : ""}`}
                        onClick={() => handlePurchasePlan(plan.id)}
                        disabled={isPurchasing || plan.priceNumber === 0 || !plan.canPurchase}
                      >
                        {plan.priceNumber === 0 ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Current Plan
                          </>
                        ) : !plan.canPurchase ? (
                          <>
                            <Building className="h-4 w-4 mr-1" />
                            Not Available
                          </>
                        ) : isPurchasing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2" />
                            Activating...
                          </>
                        ) : (
                          <>
                            {colorScheme.popular && (
                              <Crown className="h-4 w-4 mr-1" />
                            )}
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
              <p className="text-muted-foreground text-sm">
                Check back later for subscription options.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
