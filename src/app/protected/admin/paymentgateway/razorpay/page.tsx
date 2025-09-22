import { Metadata } from 'next'
import RazorPay from '@/components/admin/RazorPay'

export const metadata: Metadata = {
  title: 'RazorPay Management | Admin',
  description: 'Manage RazorPay settings and configurations for the platform',
}

export default function RazorPayPage() {
  return <RazorPay />
}
