"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, CheckCircle } from 'lucide-react';

interface SubscriptionStatus {
  planName: string;
  status: string;
  price: string;
  billingCycle: string;
  expiryDate: string;
}

interface SubscriptionHistoryItem {
  planName: string;
  status: string;
  startDate?: string;
  expiryDate?: string;
  endDate?: string;
  amount?: string;
}

export default function ManageSubscriptionPage() {
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<SubscriptionStatus | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = React.useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const formatCurrency = (minorAmount: number | string | undefined, currency?: string) => {
      if (minorAmount == null) return null;
      const amt = typeof minorAmount === 'string' ? Number(minorAmount) : minorAmount;
      if (Number.isNaN(amt)) return null;
      const major = (amt / 100).toFixed(2);
      if (currency === 'INR') return `₹${Number(major).toLocaleString()}`;
      // fallback: show currency code then amount
      return `${currency ?? '$'} ${Number(major).toLocaleString()}`;
    };

    const loadSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/user/subscription-status');
        const data = await response.json();

        if (data.success) {
          setSubscriptionStatus(data.data);

          // If the subscription data contains a Razorpay subscription id, fetch the
          // Razorpay subscription to get its plan id, then fetch the plan to obtain
          // canonical plan name and price.
          (async () => {
            try {
              const status = data.data as unknown as Record<string, unknown>;
              const rzSubId = status.razorpaySubscriptionId || status.razorpay_subscription_id || status.razorpaySubscription || null;
              if (rzSubId && typeof rzSubId === 'string') {
                const subRes = await fetch(`/api/payments/razorpay-subscriptions/${encodeURIComponent(rzSubId)}`);
                if (subRes.ok) {
                  const subJson = await subRes.json();
                  const planId = subJson?.plan_id || subJson?.plan?.id || subJson?.planId || subJson?.plan_id;
                  if (planId) {
                    const planRes = await fetch(`/api/payments/razorpay-plans/${encodeURIComponent(String(planId))}`);
                    if (planRes.ok) {
                      const planJson = await planRes.json();
                      const plan = planJson?.data || planJson;
                      const name = plan?.name || plan?.item?.name || plan?.plan_name;
                      const minor = plan?.item?.amount ?? plan?.amount ?? null;
                      const currency = plan?.item?.currency ?? plan?.currency ?? 'INR';
                      const priceDisplay = formatCurrency(minor, currency) ?? (data.data.price ?? null);
                      if (name || priceDisplay) {
                        setSubscriptionStatus((prev) => prev ? { ...prev, planName: name ?? prev.planName, price: priceDisplay ?? prev.price, billingCycle: plan?.period ?? prev.billingCycle } : (data.data as SubscriptionStatus));
                      }
                    }
                  }
                }
              }
            } catch {
              // silent - fallback to server-provided values
            }
          })();
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load subscription status',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error loading subscription status:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subscription status',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    loadSubscriptionStatus();

    // Fetch subscription history
    const loadSubscriptionHistory = async () => {
      try {
        const response = await fetch('/api/user/subscription-history');
        const data = await response.json();
        if (data.success) {
          const history = data.data.history || [];

          // Enrich history items with Razorpay plan details when available
          const enriched = await Promise.all(history.map(async (item: unknown) => {
            const row = item as Record<string, unknown>;
            try {
              if (row.razorpaySubscriptionId && typeof row.razorpaySubscriptionId === 'string') {
                const razorpaySubId = String(row.razorpaySubscriptionId);
                // Fetch the razorpay subscription to get its plan id
                const subRes = await fetch(`/api/payments/razorpay-subscriptions/${encodeURIComponent(razorpaySubId)}`);
                if (subRes.ok) {
                  const subJson = await subRes.json();
                  const planId = subJson?.plan_id || subJson?.plan?.id || subJson?.planId || subJson?.plan_id;
                  if (planId) {
                    const planRes = await fetch(`/api/payments/razorpay-plans/${encodeURIComponent(String(planId))}`);
                    if (planRes.ok) {
                      const planJson = await planRes.json();
                      const plan = planJson?.data || planJson;
                      const planName = plan?.name || plan?.item?.name || plan?.plan_name;
                      const amount = plan?.item?.amount ?? plan?.amount ?? row.amount;
                      return { ...row, planName: planName || (row.planName as string | undefined), amount: amount ?? row.amount };
                    }
                  }
                }
              }
            } catch {
              // ignore and fallback
            }
            return row;
          }));

          setSubscriptionHistory(enriched);
        }
      } catch {
        // Optionally handle error
      }
    };
    loadSubscriptionHistory();
  }, [toast]);

  React.useEffect(() => {
    const updateExpiredSubscriptions = async () => {
      // Call a backend endpoint to update expired subscriptions in DB
      await fetch('/api/user/subscription-status', { method: 'POST' });
    };
    updateExpiredSubscriptions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatHistoryAmount = (amount?: string | number) => {
    if (amount == null) return null;
    // If amount is already a formatted string containing non-digits, return as-is
    if (typeof amount === 'string' && /[^0-9]/.test(amount)) return amount;
    const n = typeof amount === 'string' ? Number(amount) : amount;
    if (Number.isNaN(n)) return String(amount);
    const major = n / 100;
    return major.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    // Inline skeletons while subscription data and history load
    return (
      <div className="space-y-8">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-slate-50/30 to-gray-50/20 dark:from-gray-800 dark:via-slate-950/20 dark:to-slate-950/10 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center text-2xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 mr-3">
                <Crown className="h-6 w-6 text-white" />
              </div>
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 p-4 rounded-xl bg-gray-100/60 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Plan</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Start Date</th>
                    <th className="px-4 py-2 text-left">End/Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 1 }).map((_, r) => (
                    <tr key={r} className="border-b last:border-0">
                      <td className="px-4 py-6"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="px-4 py-6"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="px-4 py-6"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="px-4 py-6"><div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="px-4 py-6"><div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-slate-50/30 to-gray-50/20 dark:from-gray-800 dark:via-slate-950/20 dark:to-slate-950/10 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center text-2xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 mr-3">
              <Crown className="h-6 w-6 text-white" />
            </div>
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Plan</p>
              <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {!subscriptionStatus
                  ? "You don't have a subscription yet. Choose a plan to get started!"
                  : !['active', 'trialing'].includes(subscriptionStatus.status)
                    ? 'No plan is active currently'
                    : (subscriptionStatus.planName || (subscriptionHistory && subscriptionHistory.length > 0 ? subscriptionHistory[0].planName : undefined))}
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <div>
                {subscriptionStatus?.status && subscriptionStatus.planName && subscriptionStatus.planName !== 'No plan is active currently' && (
                  <Badge
                    className={
                      subscriptionStatus.status === 'trialing'
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/30 dark:to-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 px-3 py-1.5 font-semibold'
                        : subscriptionStatus.status === 'cancelled' || subscriptionStatus.status === 'expired'
                        ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/30 dark:to-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 px-3 py-1.5 font-semibold'
                        : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border-green-200 dark:border-green-800 px-3 py-1.5 font-semibold'
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    {subscriptionStatus.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Only show Billing and Next Billing/Valid Until if active/trialing */}
            {subscriptionStatus && ['active', 'trialing'].includes(subscriptionStatus.status) && (
              <>
                <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Billing</p>
                  <p className="text-xl font-bold">
                    {subscriptionStatus.price || 'N/A'}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / {subscriptionStatus.billingCycle || 'N/A'}
                    </span>
                  </p>
                </div>
                <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {subscriptionStatus.status === 'lifetime' ? 'Valid Until' : 'Next Billing'}
                  </p>
                  <p className="text-xl font-bold">
                    {subscriptionStatus.expiryDate ? (
                      subscriptionStatus.status === 'lifetime' ?
                        'Lifetime' :
                        formatDate(subscriptionStatus.expiryDate)
                    ) : 'N/A'}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription History</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionHistory.length === 0 ? (
            <p className="text-muted-foreground">No subscription history found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Plan</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Start Date</th>
                    <th className="px-4 py-2 text-left">End/Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionHistory.map((sub, idx) => {
                    let status = sub.status || 'N/A';
                    if (sub.expiryDate && new Date(sub.expiryDate) < new Date()) {
                      status = 'Expired';
                    }
                    return (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-4 py-2">{sub.planName || 'N/A'}</td>
                        <td className="px-4 py-2">{status}</td>
                        <td className="px-4 py-2">{sub.amount ? `$${formatHistoryAmount(sub.amount)}` : 'N/A'}</td>
                        <td className="px-4 py-2">{sub.startDate ? formatDate(sub.startDate) : 'N/A'}</td>
                        <td className="px-4 py-2">{sub.expiryDate ? formatDate(sub.expiryDate) : (sub.endDate ? formatDate(sub.endDate) : 'N/A')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
