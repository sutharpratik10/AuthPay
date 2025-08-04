import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, CreditCard, Settings, Play, Pause, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog } from '@/components/ui/alert-dialog';

interface SubscriptionDetails {
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  planName?: string;
  billingCycle?: string;
  isSubscription: boolean;
  merchantSubscriptionId?: string;
  phonepeStatus?: {
    merchantSubscriptionId?: string;
    subscriptionId?: string;
    state?: string;
    authWorkflowType?: string;
    amountType?: string;
    maxAmount?: number;
    frequency?: string;
    expireAt?: Date;
    pauseStartDate?: Date;
    pauseEndDate?: Date;
  };
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionPaymentManagerProps {
  subscriptionId?: string;
  orderId?: string;
  onStatusUpdate?: (status: SubscriptionDetails) => void;
}

export default function SubscriptionPaymentManager({ 
  subscriptionId, 
  orderId, 
  onStatusUpdate 
}: SubscriptionPaymentManagerProps) {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    action: string;
    title: string;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!subscriptionId && !orderId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (subscriptionId) params.append('subscriptionId', subscriptionId);
      if (orderId) params.append('orderId', orderId);

      const response = await fetch(`/api/payments/phonepe/subscription-status?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubscription(data.data);
        onStatusUpdate?.(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch subscription status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subscription status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [subscriptionId, orderId, onStatusUpdate, toast]);

  const handleSubscriptionAction = async (action: 'cancel' | 'pause' | 'unpause') => {
    if (!subscription?.merchantSubscriptionId) return;

    setActionLoading(action);
    try {
      const response = await fetch('/api/payments/phonepe/manage-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          subscriptionId: subscription.merchantSubscriptionId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.data.message || `Subscription ${action} completed successfully`
        });
        
        // Refresh subscription status
        await fetchSubscriptionStatus();
      } else {
        toast({
          title: 'Error',
          description: data.error || `Failed to ${action} subscription`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} subscription`,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
      setShowConfirmDialog(null);
    }
  };

  const getStatusBadge = (status: string, phonepeState?: string) => {
    const displayStatus = phonepeState || status;
    
    switch (displayStatus) {
      case 'ACTIVE':
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'PAUSED':
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'CANCELLED':
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'REVOKED':
        return <Badge className="bg-red-100 text-red-800">Revoked</Badge>;
      case 'EXPIRED':
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      case 'ACTIVATION_IN_PROGRESS':
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      case 'FAILED':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const canManageSubscription = (status: string, phonepeState?: string) => {
    const state = phonepeState || status;
    return ['ACTIVE', 'success', 'PAUSED', 'paused'].includes(state);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  React.useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading subscription details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>No subscription found</p>
          <Button onClick={fetchSubscriptionStatus} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription Details</span>
            {getStatusBadge(subscription.status, subscription.phonepeStatus?.state)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Plan</label>
              <p className="text-lg font-semibold">{subscription.planName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="text-lg font-semibold">
                {subscription.currency} {subscription.amount.toFixed(2)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Billing Cycle</label>
              <p className="capitalize">{subscription.billingCycle}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Order ID</label>
              <p className="font-mono text-sm">{subscription.orderId}</p>
            </div>
          </div>

          {/* PhonePe Subscription Details */}
          {subscription.isSubscription && subscription.phonepeStatus && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">PhonePe Subscription Status</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500">Subscription ID</label>
                  <p className="font-mono">{subscription.phonepeStatus.subscriptionId}</p>
                </div>
                <div>
                  <label className="text-gray-500">Frequency</label>
                  <p className="capitalize">{subscription.phonepeStatus.frequency}</p>
                </div>
                <div>
                  <label className="text-gray-500">Max Amount</label>
                  <p>₹{subscription.phonepeStatus.maxAmount ? (subscription.phonepeStatus.maxAmount / 100).toFixed(2) : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-500">Amount Type</label>
                  <p className="capitalize">{subscription.phonepeStatus.amountType}</p>
                </div>
                {subscription.phonepeStatus.expireAt && (
                  <div>
                    <label className="text-gray-500">Expires At</label>
                    <p>{formatDate(subscription.phonepeStatus.expireAt)}</p>
                  </div>
                )}
                {subscription.phonepeStatus.pauseStartDate && (
                  <div>
                    <label className="text-gray-500">Paused From</label>
                    <p>{formatDate(subscription.phonepeStatus.pauseStartDate)}</p>
                  </div>
                )}
                {subscription.phonepeStatus.pauseEndDate && (
                  <div>
                    <label className="text-gray-500">Paused Until</label>
                    <p>{formatDate(subscription.phonepeStatus.pauseEndDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-500">Created</label>
                <p>{formatDate(subscription.createdAt)}</p>
              </div>
              <div>
                <label className="text-gray-500">Last Updated</label>
                <p>{formatDate(subscription.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {subscription.isSubscription && canManageSubscription(subscription.status, subscription.phonepeStatus?.state) && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Manage Subscription</h4>
              <div className="flex space-x-3">
                {subscription.phonepeStatus?.state === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmDialog({
                      action: 'pause',
                      title: 'Pause Subscription',
                      message: 'Are you sure you want to pause this subscription? You can unpause it later.'
                    })}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'pause' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    Pause
                  </Button>
                )}

                {subscription.phonepeStatus?.state === 'PAUSED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmDialog({
                      action: 'unpause',
                      title: 'Resume Subscription',
                      message: 'Are you sure you want to resume this subscription?'
                    })}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'unpause' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Resume
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowConfirmDialog({
                    action: 'cancel',
                    title: 'Cancel Subscription',
                    message: 'Are you sure you want to cancel this subscription? This action cannot be undone.'
                  })}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'cancel' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubscriptionStatus}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <AlertDialog
          open={!!showConfirmDialog}
          onClose={() => setShowConfirmDialog(null)}
          title={showConfirmDialog.title}
          description={showConfirmDialog.message}
          confirmText={showConfirmDialog.action.charAt(0).toUpperCase() + showConfirmDialog.action.slice(1)}
          confirmVariant={showConfirmDialog.action === 'cancel' ? 'destructive' : 'default'}
          onConfirm={() => handleSubscriptionAction(showConfirmDialog.action as 'cancel' | 'pause' | 'unpause')}
          loading={!!actionLoading}
        />
      )}
    </>
  );
}
