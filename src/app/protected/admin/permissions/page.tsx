import { auth } from '@/config/auth';
import { redirect } from 'next/navigation';
import { getAuthorizedRoute, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';
import { Metadata } from 'next';
import { RBACActivityLog } from '@/components/admin/RBACActivityLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Permissions & Audit | Admin',
  description: 'View permission audit logs and RBAC activity',
};

export default async function PermissionsAuditPage() {
  const session = await auth();
  const userId = session?.user?.id as string;
  
  // Use policy-based routing check
  const { allowed, redirectTo } = await getAuthorizedRoute(userId, ROUTE_POLICIES.ADMIN_PERMISSIONS.path);
  
  if (!allowed && redirectTo) {
    redirect(redirectTo);
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Permissions & Audit Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review all RBAC-related activities including role changes and permission assignments.
        </p>
      </div>
      
      <div className="grid gap-6">
        <Card className="border-blue-200 dark:border-blue-900 shadow-sm bg-blue-50/30 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-300">Policy Management Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-900/80 dark:text-blue-200/80">
              AuthPay uses a strictly database-driven Role-Based Access Control (RBAC) system. 
              Policies are defined by permissions grouped into roles and assigned to users. 
              Instead of managing code-based policies, all assignments and structural changes are logged here for review.
            </p>
          </CardContent>
        </Card>

        <RBACActivityLog />
      </div>
    </div>
  );
}
