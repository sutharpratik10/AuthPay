"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PhonePeSubscriptionManager } from '@/components/PhonePeSubscriptionManager';
import { Crown, CheckCircle } from 'lucide-react';

interface SubscriptionStatus {
  planName: string;
  status: string;
  price: string;
  billingCycle: string;
  expiryDate: string;
}

export default function ManageSubscriptionPage() {
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<SubscriptionStatus | null>(null);
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
  }, [toast]);

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
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-gray-800 dark:via-blue-950/20 dark:to-purple-950/10 backdrop-blur-sm">
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
                {subscriptionStatus?.planName || 'N/A'}
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <div>
                {subscriptionStatus?.status && (
                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border-green-200 dark:border-green-800 px-3 py-1.5 font-semibold">
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    {subscriptionStatus.status}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Billing</p>
              <p className="text-xl font-bold">
                {subscriptionStatus?.price || 'N/A'}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {subscriptionStatus?.billingCycle || 'N/A'}
                </span>
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {subscriptionStatus?.status === 'lifetime' ? 'Valid Until' : 'Next Billing'}
              </p>
              <p className="text-xl font-bold">
                {subscriptionStatus?.expiryDate ? (
                  subscriptionStatus.status === 'lifetime' ? 
                    'Lifetime' : 
                    formatDate(subscriptionStatus.expiryDate)
                ) : 'N/A'}
              </p>
            </div>          </div>
        </CardContent>
      </Card>

      {/* PhonePe Subscription Management */}
      <PhonePeSubscriptionManager />
    </div>
  );
}
