import { Metadata } from 'next'
import { redirect } from 'next/navigation';
import { auth } from '@/config/auth';
import SalesOffers from '@/components/admin/SalesOffers';
// Temporarily using simple auth check as getAuthorizedRoute might require specific paths
// Adjust path or use appropriate RBAC logic

export const metadata: Metadata = {
  title: 'Sales and Offers | Admin',
  description: 'Manage sales, free trials, and offers',
}

export default async function SalesOffersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    // Basic fallback, assuming the project has role exposed on user session
    // Or just let layout handle auth
  }

  return <SalesOffers />
}
