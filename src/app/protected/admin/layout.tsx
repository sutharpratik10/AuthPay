import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { isAdminUser, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect(ROUTE_POLICIES.AUTH_LOGIN.path);
  }

  // Check if user has admin access using policy
  const hasAdminAccess = await isAdminUser(session.user.id);
  
  if (!hasAdminAccess) {
    // No admin access - redirect to user dashboard
    redirect(ROUTE_POLICIES.USER_DASHBOARD.path);
  }

  return <>{children}</>;
}
