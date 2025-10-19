import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { isAdminUser, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect(ROUTE_POLICIES.AUTH_LOGIN.path);
  }

  // If user has admin access, redirect to admin dashboard
  const hasAdminAccess = await isAdminUser(session.user.id);
  
  if (hasAdminAccess) {
    redirect(ROUTE_POLICIES.ADMIN_DASHBOARD.path);
  }

  return <>{children}</>;
}
