import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PermissionService } from '@/services/permissions';
import AdminRolesPage from '@/components/admin/AdminRolesPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Roles | Admin',
  description: 'Manage roles and permissions for the platform',
};

export default async function RolesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }
  
  // Check if user is admin
  const isAdmin = await PermissionService.isAdmin(session.user.id);
  if (!isAdmin) {
    redirect('/protected/user/dashboard');
  }
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Roles</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create, edit, and manage roles and permissions for your organization
        </p>
      </div>
      <AdminRolesPage />
    </div>
  );
}
