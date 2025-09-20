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
    const loadSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/user/subscription-status');
        const data = await response.json();

        if (data.success) {
          setSubscriptionStatus(data.data);
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
          setSubscriptionHistory(data.data.history || []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription status...</p>
        </div>
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
                    : subscriptionStatus.planName}
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
                        <td className="px-4 py-2">{sub.amount ? `$${sub.amount}` : 'N/A'}</td>
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
