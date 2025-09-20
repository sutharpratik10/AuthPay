import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { PermissionService } from '@/services/permissions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }
  const isAdmin = await PermissionService.isAdmin(session.user.id);
  if (!isAdmin) {
    redirect('/protected/user/dashboard');
  }
  return <>{children}</>;
}
