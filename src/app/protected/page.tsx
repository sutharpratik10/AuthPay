import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { getDashboardUrl } from '@/lib/rbac/routing-utils';

/**
 * Protected root page - redirects users to their role-appropriate dashboard
 * 
 * This page acts as a smart router that:
 * - Checks authentication (redirects to login if not authenticated)
 * - Determines user's role via RBAC
 * - Redirects admin users to /protected/admin/dashboard
 * - Redirects regular users to /protected/user/dashboard
 * 
 * This eliminates the unnecessary redirect chain where admin users
 * were first sent to user dashboard, then redirected to admin dashboard.
 */
export default async function ProtectedPage() {
  const session = await auth();
  
  // If not authenticated, redirect to login
  if (!session?.user?.id) {
    redirect('/auth/login');
  }
  
  // Get the appropriate dashboard URL based on user's role/policies
  const dashboardUrl = await getDashboardUrl(session.user.id);
  
  // Redirect to the correct dashboard
  redirect(dashboardUrl);
}
