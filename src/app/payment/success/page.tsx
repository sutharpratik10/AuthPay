"use client"

import { useEffect, useState, Suspense } from 'react';
import Loading from '@/components/Loading';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { ROUTE_POLICIES } from '@/lib/rbac/routing-utils';

function PaymentSuccessContent() {
  const [loading, setLoading] = useState(true);
  const [dashboardPath, setDashboardPath] = useState(ROUTE_POLICIES.USER_DASHBOARD.path);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchDashboard() {
      if (user?.id) {
        try {
          const response = await fetch('/api/rbac/user/dashboard');
          const data = await response.json();
          if (data.dashboardUrl) {
            setDashboardPath(data.dashboardUrl);
          }
        } catch (error) {
          console.error('Error fetching dashboard URL:', error);
        }
      }
    }
    fetchDashboard();
  }, [user]);

  useEffect(() => {
    // Since we're now using internal subscription assignment,
    // show success message and redirect to subscription management
    const timer = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Subscription Activated",
        description: "Your subscription has been successfully activated!",
        variant: "success"
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [router, toast]);

  const handleGoToSubscription = () => {
    router.push('/protected/user/manage-subscription');
  };
  const handleGoToDashboard = () => {
    router.push(dashboardPath);
  };

  if (loading) {
    return <Loading text="Processing Subscription" size="lg" />;
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
    <Suspense fallback={<Loading text="Loading..." size="lg" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
