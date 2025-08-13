
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PermissionService } from '@/services/permissions';
import AdminUserRolesPage from '@/components/admin/AdminUserRolesPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage User Roles | Admin',
  description: 'Manage user roles and permissions for the platform',
};

export default async function UserRolesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }
  // Check if user is admin
  const isAdmin = await PermissionService.isAdmin(session.user.id);
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage User Roles</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage user roles and permissions across the platform
        </p>
      </div>
      
      <AdminUserRolesPage />
    </div>
  );
}
