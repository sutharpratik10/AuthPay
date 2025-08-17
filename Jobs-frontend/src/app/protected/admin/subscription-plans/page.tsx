import { Metadata } from 'next'
import AdminSubscriptionPlansPage from '@/components/admin/AdminSubscriptionPlansPage'

export const metadata: Metadata = {
  title: 'Subscription Plans Management | Admin',
  description: 'Manage subscription plans and pricing for the platform',
}

export default function SubscriptionPlansPage() {
  return <AdminSubscriptionPlansPage />
}
