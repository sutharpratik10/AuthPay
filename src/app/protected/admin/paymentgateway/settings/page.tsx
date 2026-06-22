import { Metadata } from 'next'
import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { getAuthorizedRoute, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';
import GatewaySettings from '@/components/admin/GatewaySettings'

export const metadata: Metadata = {
  title: 'Payment Gateway Settings | Admin',
  description: 'Configure which payment gateway is shown per country',
}

export default async function GatewaySettingsPage() {
  const session = await auth();
  const userId = session?.user?.id as string;

  const { allowed, redirectTo } = await getAuthorizedRoute(userId, ROUTE_POLICIES.ADMIN_PAYMENT_GATEWAY.path);

  if (!allowed && redirectTo) {
    redirect(redirectTo);
  }

  return <GatewaySettings />
}
