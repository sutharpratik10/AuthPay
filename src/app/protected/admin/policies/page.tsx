import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { getAuthorizedRoute, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';
import { AdminPoliciesPage } from '@/components/admin/AdminPoliciesPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Policies | Admin',
  description: 'Manage policies (permissions) for the platform',
};

export default async function PoliciesPage() {
  const session = await auth();
  const userId = session?.user?.id as string;
  
  const { allowed, redirectTo } = await getAuthorizedRoute(userId, ROUTE_POLICIES.ADMIN_POLICIES.path);
  
  if (!allowed && redirectTo) {
    redirect(redirectTo);
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Policies</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create, edit, and manage fine-grained policies (permissions) for your organization
        </p>
      </div>
      <AdminPoliciesPage />
    </div>
  );
}
