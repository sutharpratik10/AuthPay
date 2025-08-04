"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  Pause, 
  Play, 
  X
} from 'lucide-react';

interface SubscriptionData {
  hasSubscription: boolean;
  subscription?: {
    tenantId: string;
    tenantName: string;
    planName: string;
    planId: string;
    isActive: boolean;
    planEffectiveDate: string;
    planExpiryDate: string;
    subscriptionId?: string;
    status: string;
    billingCycle: string;
    price: string;
  };
  message?: string;
}

interface PhonePeSubscriptionManagerProps {
  className?: string;
}

export function PhonePeSubscriptionManager({ className = "" }: PhonePeSubscriptionManagerProps) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/phonepe/manage-subscription');
      const data = await response.json();

      if (data.success) {
        setSubscriptionData(data.data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load subscription data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }  };

  const loadSubscriptionDataCallback = useCallback(loadSubscriptionData, [toast]);

  useEffect(() => {
    loadSubscriptionDataCallback();
  }, [loadSubscriptionDataCallback]);

  const handleSubscriptionAction = async (action: 'cancel' | 'pause' | 'unpause') => {
    if (!subscriptionData?.subscription?.subscriptionId) {
      toast({
        title: "Error",
        description: "No subscription ID found",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(action);

    try {
      const response = await fetch('/api/payments/phonepe/manage-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          subscriptionId: subscriptionData.subscription.subscriptionId
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });        // Reload subscription data
        await loadSubscriptionDataCallback();
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${action} subscription`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} subscription`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive || status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    
    switch (status) {
      case 'success':
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading subscription details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionData?.hasSubscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
          <CardDescription>
            Manage your PhonePe subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
            <p className="text-muted-foreground mb-4">
              {subscriptionData?.message || "You don't have an active subscription."}
            </p>
            <Button onClick={() => window.location.href = '/protected/dashboard'}>
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { subscription } = subscriptionData;

  if (!subscription) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Subscription data not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription Management
        </CardTitle>
        <CardDescription>
          Manage your PhonePe subscription for {subscription.tenantName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">{subscription.planName}</h4>
            <p className="text-sm text-muted-foreground">
              {subscription.price} / {subscription.billingCycle}
            </p>
          </div>
          {getStatusBadge(subscription.status, subscription.isActive)}
        </div>

        {/* Subscription Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Started:</span>
              <span>{formatDate(subscription.planEffectiveDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Expires:</span>
              <span>{formatDate(subscription.planExpiryDate)}</span>
            </div>
          </div>
          
          {subscription.subscriptionId && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Subscription ID:</span>
                <p className="text-muted-foreground font-mono text-xs break-all">
                  {subscription.subscriptionId}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {subscription.subscriptionId && subscription.isActive && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {subscription.status === 'paused' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSubscriptionAction('unpause')}
                disabled={actionLoading === 'unpause'}
                className="flex items-center gap-2"
              >
                {actionLoading === 'unpause' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-current"></div>
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Resume Subscription
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSubscriptionAction('pause')}
                disabled={actionLoading === 'pause'}
                className="flex items-center gap-2"
              >
                {actionLoading === 'pause' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-current"></div>
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                Pause Subscription
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={actionLoading !== null}
                >
                  <X className="h-4 w-4" />
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your subscription to {subscription.planName}?
                    This action cannot be undone and you will lose access to all paid features.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleSubscriptionAction('cancel')}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={actionLoading === 'cancel'}
                  >
                    {actionLoading === 'cancel' ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-current"></div>
                        Cancelling...
                      </div>
                    ) : (
                      'Yes, Cancel Subscription'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Refresh Button */}
        <div className="pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSubscriptionDataCallback}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-current"></div>
                Refreshing...
              </div>
            ) : (
              'Refresh Status'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
