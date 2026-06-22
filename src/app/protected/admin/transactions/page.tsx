import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import { getAuthorizedRoute, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';
import Transactions from '@/components/admin/Transactions';

export default async function Page() {
  // ProtectedRoute handles authentication
  // Use policy-based authorization check here
  const session = await auth();
  const userId = session?.user?.id as string;
  
  const { allowed, redirectTo } = await getAuthorizedRoute(userId, ROUTE_POLICIES.ADMIN_TRANSACTIONS.path);
  
  if (!allowed && redirectTo) {
    redirect(redirectTo);
  }

  return (
    <div className="p-4">
      <Transactions />
    </div>
  );
}
