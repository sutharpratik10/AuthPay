"use client"

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function PaymentSuccessContent() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Since we're now using internal subscription assignment,
    // show success message and redirect to subscription management
    const timer = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Subscription Activated",
        description: "Your subscription has been successfully activated!",
        variant: "default"
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [router, toast]);

  const handleGoToSubscription = () => {
    router.push('/protected/user/manage-subscription');
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
            <h2 className="text-xl font-semibold mb-2">Processing Subscription</h2>
            <p className="text-gray-600">Please wait while we activate your subscription...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            Subscription Activated!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              Your subscription has been successfully activated. You now have access to all premium features.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleGoToSubscription} className="w-full">
              Manage Subscription
            </Button>
            <Button 
              onClick={handleGoToDashboard} 
              variant="outline" 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
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
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-gray-600">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
