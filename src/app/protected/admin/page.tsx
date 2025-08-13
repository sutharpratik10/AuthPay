import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PermissionService } from '@/services/permissions';
import AdminUsersPage from '@/components/admin/AdminUsersPage';

export default async function AdminPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }
  // Check if user is admin
  const isAdmin = await PermissionService.isAdmin(session.user.id);
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
