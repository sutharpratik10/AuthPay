import { Suspense } from 'react';
import SubscriptionPlansSelector from '@/components/SubscriptionPlansSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SubscriptionTestContent() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">PhonePe Subscription Payment Test</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Test the recurring subscription payment system using PhonePe&apos;s subscription APIs.
        </p>
      </div>

      {/* Main Subscription Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Recurring Subscription Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Automatic recurring billing with PhonePe&apos;s subscription service. Cancel anytime from your dashboard.
          </p>
          <SubscriptionPlansSelector 
            showTitle={false}
            className="max-w-4xl mx-auto"
          />
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-600">Automated Billing</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Automatic recurring payments</li>
                <li>✓ No manual renewal required</li>
                <li>✓ Seamless subscription experience</li>
                <li>✓ Predictable revenue stream</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-green-600">Management Features</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Pause/resume subscription anytime</li>
                <li>✓ Cancel subscription through dashboard</li>
                <li>✓ Real-time subscription status</li>
                <li>✓ Advanced subscription analytics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionTestPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading subscription test page...</p>
          </div>
        </div>
      </div>
    }>
      <SubscriptionTestContent />
    </Suspense>
  );
}
