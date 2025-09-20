import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminUsersPage from '@/components/admin/AdminUsersPage';

export default async function ManageUsersPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Users</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create, edit, and manage user accounts and roles
        </p>
      </div>
      <AdminUsersPage />
    </div>
  );
}
