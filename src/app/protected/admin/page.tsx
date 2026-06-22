import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { getAuthorizedRoute, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';
import AdminUsersPage from '@/components/admin/AdminUsersPage';

export default async function AdminPage() {
  // ProtectedRoute handles all authentication
  // Use policy-based authorization check here
  const session = await auth();
  const userId = session?.user?.id as string;
  
  // Check if user has access to admin dashboard using policy
  const { allowed, redirectTo } = await getAuthorizedRoute(userId, ROUTE_POLICIES.ADMIN_DASHBOARD.path);
  
  if (!allowed && redirectTo) {
    redirect(redirectTo);
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage users, roles, and system settings
        </p>
      </div>
      
      <AdminUsersPage />
    </div>
  );
}
