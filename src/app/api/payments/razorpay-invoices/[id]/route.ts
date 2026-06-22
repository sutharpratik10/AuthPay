import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { withDynamicApiHandler, errorResponse } from '@/lib/api/helpers';
import { isAdmin, filterInvoicesForUser } from '@/lib/api/payment-authorization';

export const runtime = 'nodejs';

/**
 * GET /api/payments/razorpay-invoices/[id]
 * Fetch a specific Razorpay invoice by ID
 * 
 * @protected Requires authentication
 * @authorization Admin can access any invoice; users can only access their own invoices
 * @param {string} id - Invoice ID
 */
export const GET = withDynamicApiHandler<{ id?: string }>(
  async (request, { user, params }) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return errorResponse('Missing Razorpay credentials', 500);
    }

    const invoiceId = params?.id;
    if (!invoiceId) {
      return errorResponse('Invoice id required', 400);
    }

    const isAdminUser = await isAdmin(user!.id);
    console.log(`[razorpay-invoices/${invoiceId}] Fetching invoice for user: ${user?.id} (admin: ${isAdminUser})`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const invoice = await razorpay.invoices.fetch(invoiceId);
    
    // Authorization check: verify user can access this invoice
    if (!isAdminUser) {
      const authorizedInvoices = await filterInvoicesForUser(user!.id, [invoice as unknown as Record<string, unknown>]);
      if (authorizedInvoices.length === 0) {
        console.log(`[razorpay-invoices/${invoiceId}] Access denied for user ${user!.id}`);
        return errorResponse('You do not have permission to access this invoice', 403);
      }
    }
    
    return NextResponse.json({ ...invoice, isAdmin: isAdminUser });
  },
  { requireAuth: true }
);
