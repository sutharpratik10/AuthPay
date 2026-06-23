import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { getAuthorizedRoute, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';
import { getRevenueData, getUserGrowthData, getChurnRateData, getDashboardLayout, getAvailableWidgets } from './actions/analytics';
import { MetricSummaryCard } from '@/components/analytics/MetricSummaryCard';
import { DashboardGrid } from '@/components/analytics/DashboardGrid';

export default async function AdminDashboardPage(props: { searchParams: { range?: string } }) {
  // Server-side authentication and authorization
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }
  
  const userId = session.user.id;
  
  // Policy-based authorization check
  const { allowed, redirectTo } = await getAuthorizedRoute(userId, ROUTE_POLICIES.ADMIN_DASHBOARD.path);
  
  if (!allowed && redirectTo) {
    redirect(redirectTo);
  }

  const searchParams = await props.searchParams;
  const range = (searchParams?.range || "30d") as any;

  // Prefetch data in parallel
  const [revenue, growth, churn, layout, availableWidgets] = await Promise.all([
    getRevenueData(range),
    getUserGrowthData(range),
    getChurnRateData(range),
    getDashboardLayout(userId),
    getAvailableWidgets()
  ]);

  const initialData = { revenue, growth, churn };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name || 'Admin'}. Here's your personalized overview.
        </p>
      </div>

      <MetricSummaryCard />

      <DashboardGrid 
        userId={userId} 
        initialLayout={layout} 
        initialData={initialData}
        availableWidgets={availableWidgets} 
      />
    </div>
  );
}
