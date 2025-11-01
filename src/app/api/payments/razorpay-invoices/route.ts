import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { withApiHandler, errorResponse } from '@/lib/api/helpers';
import { isAdmin, filterInvoicesForUser } from '@/lib/api/payment-authorization';

export const runtime = 'nodejs';

/**
 * GET /api/payments/razorpay-invoices
 * Fetch Razorpay invoices with optional filtering
 * 
 * @protected Requires authentication
 * @authorization Admin can access all invoices; users can only access their own invoices
 * @queryparam {string} subscription_id - Filter by subscription ID
 * @queryparam {number} count - Number of items to return (default: 20)
 * @queryparam {number} skip - Number of items to skip (default: 0)
 * @queryparam {string} status - Filter by status
 * @queryparam {string} customer_id - Filter by customer ID
 * @queryparam {string} payment_id - Filter by payment ID
 */
export const GET = withApiHandler(
  async (request, { user }) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return errorResponse('Missing Razorpay credentials', 500);
    }

    const url = new URL(request.url);
    const subscription_id = url.searchParams.get('subscription_id');
    const count = url.searchParams.get('count') ? Number(url.searchParams.get('count')) : 20;
    const skip = url.searchParams.get('skip') ? Number(url.searchParams.get('skip')) : 0;
    const status = url.searchParams.get('status') || undefined;
    const customer_id = url.searchParams.get('customer_id') || undefined;
    const payment_id = url.searchParams.get('payment_id') || undefined;

    const isAdminUser = await isAdmin(user!.id);
    console.log(`[razorpay-invoices] Fetching invoices for user: ${user?.id} (admin: ${isAdminUser})`);

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    // Build params object for invoices.all. subscription_id is optional; if present include it.
    const params: Record<string, unknown> = { count, skip };
    if (subscription_id) params.subscription_id = subscription_id;
    if (status) params.status = status;
    if (customer_id) params.customer_id = customer_id;
    if (payment_id) params.payment_id = payment_id;

    const invoices = await razorpay.invoices.all(params as unknown as Record<string, unknown>);
    
    // Apply authorization filtering
    let authorizedItems = (invoices?.items || []) as unknown[];
    if (!isAdminUser) {
      authorizedItems = await filterInvoicesForUser(user!.id, authorizedItems as Record<string, unknown>[]);
      console.log(`[razorpay-invoices] User ${user!.id} authorized to see ${authorizedItems.length} invoices out of ${invoices?.items?.length || 0}`);
    }
    
    return NextResponse.json({
      entity: 'collection',
      count: authorizedItems.length,
      items: authorizedItems,
      isAdmin: isAdminUser
    });
  },
  { requireAuth: true }
);
