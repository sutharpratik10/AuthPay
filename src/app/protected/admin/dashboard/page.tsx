import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { getAuthorizedRoute, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default async function AdminDashboardPage() {
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

  // Pass data to client component
  return <AdminDashboard adminName={session.user.name || 'Admin'} />;
}
