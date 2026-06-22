import { Metadata } from 'next'
import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { getAuthorizedRoute, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';
import RazorPay from '@/components/admin/RazorPay'

export const metadata: Metadata = {
  title: 'RazorPay Management | Admin',
  description: 'Manage RazorPay settings and configurations for the platform',
}

export default async function RazorPayPage() {
  // ProtectedRoute handles authentication
  // Use policy-based authorization check here
  const session = await auth();
  const userId = session?.user?.id as string;
  
  const { allowed, redirectTo } = await getAuthorizedRoute(userId, ROUTE_POLICIES.ADMIN_PAYMENT_GATEWAY.path);
  
  if (!allowed && redirectTo) {
    redirect(redirectTo);
  }

  return <RazorPay />
}
