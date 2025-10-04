import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { PermissionService } from '@/server/services/permissions';

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }
  const isAdmin = await PermissionService.isAdmin(session.user.id);
  if (isAdmin) {
    redirect('/protected/admin/dashboard');
  }
  return <>{children}</>;
}
