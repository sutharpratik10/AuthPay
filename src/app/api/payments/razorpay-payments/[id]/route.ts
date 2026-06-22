import { NextResponse } from 'next/server';
import { withDynamicApiHandler, errorResponse } from '@/lib/api/helpers';
import { isAdmin, filterPaymentsForUser } from '@/lib/api/payment-authorization';

/**
 * GET /api/payments/razorpay-payments/[id]
 * Fetch a specific Razorpay payment by ID
 * 
 * @protected Requires authentication
 * @authorization Admin can access any payment; users can only access their own payments
 * @param {string} id - Payment ID
 */
export const GET = withDynamicApiHandler<{ id?: string }>(
  async (request, { user, params }) => {
    const id = params?.id;
    if (!id) {
      return errorResponse('Missing payment id', 400);
    }

    const key = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key || !secret) {
      return errorResponse('Razorpay credentials not configured on server', 500);
    }

    const isAdminUser = await isAdmin(user!.id);
    console.log(`[razorpay-payments/${id}] Fetching payment for user: ${user?.id} (admin: ${isAdminUser})`);

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    try {
      const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
      });

      const text = await res.text();
      // Try parse JSON, otherwise return raw text
      try {
        const data = JSON.parse(text);
        
        // Authorization check: verify user can access this payment
        if (!isAdminUser) {
          const authorizedPayments = await filterPaymentsForUser(user!.id, [data]);
          if (authorizedPayments.length === 0) {
            console.log(`[razorpay-payments/${id}] Access denied for user ${user!.id}`);
            return errorResponse('You do not have permission to access this payment', 403);
          }
        }
        
        return NextResponse.json({ ...data, isAdmin: isAdminUser }, { status: res.status });
      } catch {
        return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'text/plain' } });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return errorResponse(`Failed to contact Razorpay API: ${message}`, 502);
    }
  },
  { requireAuth: true }
);

