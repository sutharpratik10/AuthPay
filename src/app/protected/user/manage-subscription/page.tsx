"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface SubscriptionStatus {
  planName: string;
  status: string;
  price: string;
  billingCycle: string;
  expiryDate: string;
  razorpaySubscriptionId?: string | null;
}

interface SubscriptionHistoryItem {
  planName: string;
  status: string;
  startDate?: string;
  expiryDate?: string;
  endDate?: string;
  amount?: string;
  invoiceUrl?: string;
  razorpaySubscriptionId?: string;
}

export default function ManageSubscriptionPage() {
  const { subscriptionStatus: contextStatus, refreshSubscription } = useSubscription();
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<SubscriptionStatus | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = React.useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cancelling, setCancelling] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const { toast } = useToast();

  // Use context subscription status and enrich with Razorpay details
  React.useEffect(() => {
    let isMounted = true;

    const enrichSubscriptionWithRazorpay = async () => {
      if (!contextStatus || !contextStatus.hasSubscription) {
        if (isMounted) {
          setSubscriptionStatus(null);
          setLoading(false);
        }
        return;
      }

      const formatCurrency = (minorAmount: number | string | undefined, currency?: string) => {
        if (minorAmount == null) return null;
        const amt = typeof minorAmount === 'string' ? Number(minorAmount) : minorAmount;
        if (Number.isNaN(amt)) return null;
        const major = (amt / 100).toFixed(2);
        if (currency === 'INR') return `₹${Number(major).toLocaleString()}`;
        return `${currency ?? '$'} ${Number(major).toLocaleString()}`;
      };

      try {
        const enrichedStatus: SubscriptionStatus = {
          planName: contextStatus.planName || 'Unknown',
          status: contextStatus.status || 'Unknown',
          price: contextStatus.price || 'N/A',
          billingCycle: contextStatus.billingCycle || 'N/A',
          expiryDate: contextStatus.expiryDate || 'N/A',
          razorpaySubscriptionId: contextStatus.razorpaySubscriptionId
        };

        // Enrich with Razorpay plan details if available
        const rzSubId = enrichedStatus.razorpaySubscriptionId;
        if (rzSubId && typeof rzSubId === 'string') {
          try {
            const subRes = await fetch(`/api/payments/razorpay-subscriptions/${encodeURIComponent(rzSubId)}`);
            if (subRes.ok) {
              const subJson = await subRes.json();
              const planId = subJson?.plan_id || subJson?.plan?.id;
              if (planId) {
                const planRes = await fetch(`/api/payments/razorpay-plans/${encodeURIComponent(String(planId))}`);
                if (planRes.ok) {
                  const planJson = await planRes.json();
                  const plan = planJson?.data || planJson;
                  const name = plan?.name || plan?.item?.name;
                  const minor = plan?.item?.amount ?? plan?.amount;
                  const currency = plan?.item?.currency ?? plan?.currency ?? 'INR';
                  const priceDisplay = formatCurrency(minor, currency);
                  
                  if (name) enrichedStatus.planName = name;
                  if (priceDisplay) enrichedStatus.price = priceDisplay;
                  if (plan?.period) enrichedStatus.billingCycle = plan.period;
                }
              }
            }
          } catch (err) {
            console.error('Error enriching subscription status:', err);
          }
        }

        if (isMounted) {
          setSubscriptionStatus(enrichedStatus);
        }
      } catch (error) {
        console.error('Error enriching subscription:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    enrichSubscriptionWithRazorpay();

    return () => {
      isMounted = false;
    };
  }, [contextStatus]);

  // Load subscription history separately
  React.useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const historyResponse = await fetch('/api/user/subscription-history');
        const historyData = await historyResponse.json();

        if (!isMounted) return;

        // Process subscription history with enrichment BEFORE setting state
        if (historyData.success) {
          const history = historyData.data.history || [];

          // Enrich history items with Razorpay plan details when available
          const enriched = await Promise.all(history.map(async (item: unknown) => {
            const row = item as Record<string, unknown>;
            try {
              if (row.razorpaySubscriptionId && typeof row.razorpaySubscriptionId === 'string') {
                const subRes = await fetch(`/api/payments/razorpay-subscriptions/${encodeURIComponent(String(row.razorpaySubscriptionId))}`);
                if (subRes.ok) {
                  const subJson = await subRes.json();
                  const planId = subJson?.plan_id || subJson?.plan?.id;
                  
                  // Get invoice URL if available
                  const invoiceUrl = subJson?.short_url || null;
                  
                  if (planId) {
                    const planRes = await fetch(`/api/payments/razorpay-plans/${encodeURIComponent(String(planId))}`);
                    if (planRes.ok) {
                      const planJson = await planRes.json();
                      const plan = planJson?.data || planJson;
                      const planName = plan?.name || plan?.item?.name;
                      const amount = plan?.item?.amount ?? plan?.amount;
                      return { 
                        ...row, 
                        planName: planName || row.planName, 
                        amount: amount ?? row.amount,
                        invoiceUrl: invoiceUrl,
                        razorpaySubscriptionId: row.razorpaySubscriptionId
                      };
                    }
                  }
                  
                  return {
                    ...row,
                    invoiceUrl: invoiceUrl,
                    razorpaySubscriptionId: row.razorpaySubscriptionId
                  };
                }
              }
            } catch (err) {
              console.error('Error enriching history item:', err);
              // ignore and fallback
            }
            return row;
          }));

          if (isMounted) {
            setSubscriptionHistory(enriched);
          }
        }
      } catch (error) {
        console.error('Error loading subscription history:', error);
        if (isMounted) {
          toast({
            title: 'Error',
            description: 'Failed to load subscription history',
            variant: 'destructive'
          });
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Handler to cancel razorpay subscription
  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleCancel = async () => {
    const id = subscriptionStatus?.razorpaySubscriptionId as unknown as string;
    if (!id) return;
    
    try {
      setCancelling(true);
      setShowCancelDialog(false); // Close dialog immediately
      
      const res = await fetch(`/api/payments/razorpay-subscriptions/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_at_cycle_end: false })
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        // Update UI locally so user sees 'cancelled' immediately
        setSubscriptionStatus((prev) => prev ? { ...prev, status: 'cancelled' } : prev);

        // Refresh subscription context to update sidebar and other components
        await refreshSubscription();

        toast({ title: 'Cancelled', description: 'Subscription cancelled successfully', variant: 'success' });
      } else {
        const msg = json?.error?.description || json?.message || 'Failed to cancel subscription';
        toast({ title: 'Error', description: String(msg), variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel subscription', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

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
                {/* cancel button intentionally hidden on loading skeleton */}
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
                    <th className="px-4 py-2 text-left">Invoice</th>
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
                      <td className="px-4 py-6"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" /></td>
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
            {subscriptionStatus?.razorpaySubscriptionId && subscriptionStatus?.status === 'active' && (
              <button
                type="button"
                onClick={handleCancelClick}
                className="cursor-pointer ml-auto inline-flex items-center px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Cancel subscription'}
              </button>
            )}
            {subscriptionStatus?.status === 'cancelled' && (
              <span className="ml-auto inline-flex items-center px-3 py-1.5 rounded bg-gray-700 text-white text-sm font-medium">cancelled</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Plan</p>
              <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {!subscriptionStatus
                  ? "You don't have a subscription yet. Choose a plan to get started!"
                  : !['active', 'trialing', 'cancelled'].includes(subscriptionStatus.status)
                    ? 'No plan is active currently'
                    : (subscriptionStatus.planName || (subscriptionHistory && subscriptionHistory.length > 0 ? subscriptionHistory[0].planName : undefined))}
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <div className="space-y-2">
                {subscriptionStatus?.status && subscriptionStatus.planName && subscriptionStatus.planName !== 'No plan is active currently' && (
                  <>
                    <Badge
                      className={
                        subscriptionStatus.status === 'trialing'
                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/30 dark:to-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 px-3 py-1.5 font-semibold'
                          : subscriptionStatus.status === 'cancelled'
                          ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-900/30 dark:to-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800 px-3 py-1.5 font-semibold'
                          : subscriptionStatus.status === 'expired'
                          ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/30 dark:to-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 px-3 py-1.5 font-semibold'
                          : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border-green-200 dark:border-green-800 px-3 py-1.5 font-semibold'
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      {subscriptionStatus.status}
                    </Badge>
                    {subscriptionStatus.status === 'cancelled' && subscriptionStatus.expiryDate && new Date(subscriptionStatus.expiryDate) > new Date() && (
                      <p className="text-xs text-muted-foreground mt-1">
                        You have access until {formatDate(subscriptionStatus.expiryDate)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Only show Billing and Next Billing/Valid Until if active/trialing */}
            {subscriptionStatus && (['active', 'trialing'].includes(subscriptionStatus.status) || subscriptionStatus.status === 'cancelled') && (
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
                    {subscriptionStatus.status === 'cancelled' 
                      ? 'Access Until' 
                      : subscriptionStatus.status === 'lifetime' 
                      ? 'Valid Until' 
                      : 'Next Billing'}
                  </p>
                  <p className="text-xl font-bold">
                    {subscriptionStatus.status === 'cancelled' ? (
                      subscriptionStatus.expiryDate ? (
                        <span className="text-orange-600 dark:text-orange-400">
                          {formatDate(subscriptionStatus.expiryDate)}
                        </span>
                      ) : 'N/A'
                    ) : subscriptionStatus.expiryDate ? (
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
                    <th className="px-4 py-2 text-left">Invoice</th>
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
                        <td className="px-4 py-2">
                          {sub.invoiceUrl ? (
                            <a
                              href={sub.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                              View
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription className="pt-3 space-y-2">
              <p>
                Are you sure you want to cancel your subscription? Your subscription will not renew, 
                but you&apos;ll continue to have access to premium features until the end of your current billing period.
              </p>
              {subscriptionStatus?.expiryDate && (
                <p className="font-semibold text-foreground">
                  Access until: {formatDate(subscriptionStatus.expiryDate)}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelling}
            >
              Keep Subscription
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
