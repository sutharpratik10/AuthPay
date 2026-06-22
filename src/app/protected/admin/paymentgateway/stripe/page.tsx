import { Metadata } from 'next'
import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { getAuthorizedRoute, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';
import StripeAdmin from '@/components/admin/Stripe'

export const metadata: Metadata = {
  title: 'Stripe Management | Admin',
  description: 'Manage Stripe settings, products, subscriptions and customers for the platform',
}

export default async function StripeAdminPage() {
  const session = await auth();
  const userId = session?.user?.id as string;

  const { allowed, redirectTo } = await getAuthorizedRoute(userId, ROUTE_POLICIES.ADMIN_PAYMENT_GATEWAY.path);

  if (!allowed && redirectTo) {
    redirect(redirectTo);
  }

  return <StripeAdmin />
}
