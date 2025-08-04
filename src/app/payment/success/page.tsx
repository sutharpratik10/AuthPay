"use client"

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentStatus {
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  planName?: string;
  createdAt: string;
  providerOrderId?: string;
  merchantTransactionId?: string;
}

function PaymentSuccessContent() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/phonepe/order-status?orderId=${orderId}`);
        const data = await response.json();

        if (data.success) {
          setPaymentStatus(data.data);
        } else {
          setError(data.error || 'Failed to fetch payment status');
        }
      } catch (err) {
        setError('Failed to check payment status');
        console.error('Error checking payment status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();

    // Poll for status updates every 5 seconds for pending payments
    const interval = setInterval(checkPaymentStatus, 5000);

    // Clear interval after 2 minutes
    const timeout = setTimeout(() => clearInterval(interval), 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [orderId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-600" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-600" />;
      default:
        return <AlertCircle className="h-16 w-16 text-gray-600" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'success':
        return {
          title: 'Payment Successful!',
          message: 'Your subscription has been activated successfully.',
          color: 'text-green-800'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          color: 'text-red-800'
        };
      case 'pending':
        return {
          title: 'Payment Pending',
          message: 'Your payment is being processed. Please wait...',
          color: 'text-yellow-800'
        };
      default:
        return {
          title: 'Payment Status Unknown',
          message: 'We are checking your payment status.',
          color: 'text-gray-800'
        };
    }
  };

  const handleRetryPayment = () => {
    router.push('/protected/dashboard');
    toast({
      title: "Redirecting",
      description: "Taking you back to try payment again",
    });
  };

  const handleGoToDashboard = () => {
    router.push('/protected/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Checking Payment Status</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-800">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={handleGoToDashboard} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentStatus) {
    return null;
  }

  const statusInfo = getStatusMessage(paymentStatus.status);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon(paymentStatus.status)}
          </div>
          <CardTitle className={`text-2xl ${statusInfo.color}`}>
            {statusInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">{statusInfo.message}</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-mono">{paymentStatus.orderId}</span>
                </div>
                {paymentStatus.planName && (
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span>{paymentStatus.planName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>{paymentStatus.currency} {paymentStatus.amount.toFixed(2)}</span>
                </div>                {paymentStatus.providerOrderId && (
                  <div className="flex justify-between">
                    <span>Provider Order ID:</span>
                    <span className="font-mono text-xs">{paymentStatus.providerOrderId}</span>
                  </div>
                )}
                {paymentStatus.merchantTransactionId && (
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-xs">{paymentStatus.merchantTransactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`capitalize font-semibold ${statusInfo.color}`}>
                    {paymentStatus.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {paymentStatus.status === 'success' && (
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            )}
            
            {paymentStatus.status === 'failed' && (
              <>
                <Button onClick={handleRetryPayment} className="w-full">
                  Try Again
                </Button>
                <Button 
                  onClick={handleGoToDashboard} 
                  variant="outline" 
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </>
            )}
            
            {paymentStatus.status === 'pending' && (
              <Button 
                onClick={handleGoToDashboard} 
                variant="outline" 
                className="w-full"
              >
                Go to Dashboard
              </Button>
            )}          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Loading Payment Status</h2>
            <p className="text-gray-600">Please wait while we check your payment...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
