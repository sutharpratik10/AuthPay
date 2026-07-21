import { Metadata } from 'next';
import { RefundRequests } from '@/components/admin/RefundRequests';

export const metadata: Metadata = {
  title: 'Refund Requests - Admin',
  description: 'Manage refund requests',
};

export default function AdminRefundsPage() {
  return (
    <div className="container mx-auto py-6">
      <RefundRequests />
    </div>
  );
}
