import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { getAuthorizedRoute, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';
import { getOverviewStats } from './actions/analytics';
import { LiveMetricCard } from '@/components/analytics/LiveMetricCard';
import { AdminNotificationPanel } from '@/components/admin/AdminNotificationPanel';

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

  // Fetch overview stats
  const overviewStats = await getOverviewStats();

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name || 'Admin'}. Here's your personalized overview.
        </p>
      </div>

      <LiveMetricCard initialStats={overviewStats} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AdminNotificationPanel />
        </div>
      </div>
    </div>
  );
}
