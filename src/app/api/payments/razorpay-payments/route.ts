import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { withApiHandler, errorResponse } from '@/lib/api/helpers';
import { filterPaymentsForUser, isAdmin } from '@/lib/api/payment-authorization';

/**
 * Razorpay Payments API
 * 
 * Fetches payment transactions from Razorpay with pagination and filtering.
 * 
 * @endpoint GET /api/payments/razorpay-payments
 * @protected Requires authentication
 * @authorization Admins can see all payments, users can only see their own
 * 
 * @queryparam {number} count - Number of items to fetch per page (default: 10, max: 10 for test accounts)
 * @queryparam {number} skip - Number of items to skip for pagination (default: 0)
 * @queryparam {number} from - Unix timestamp to filter payments from (optional)
 * @queryparam {number} to - Unix timestamp to filter payments to (optional)
 * @queryparam {string} q - Search query to filter by payment ID, order ID, or email (optional)
 * @queryparam {boolean} fetchAll - Fetch all payments across multiple pages (default: false)
 * 
 * @returns {object} Razorpay collection response with items array
 * 
 * @example
 * // Fetch first 10 payments
 * GET /api/payments/razorpay-payments?count=10&skip=0
 * 
 * // Fetch ALL payments (auto-pagination)
 * GET /api/payments/razorpay-payments?fetchAll=true
 * 
 * // Search payments by email
 * GET /api/payments/razorpay-payments?q=user@example.com
 * 
 * // Pagination (second page)
 * GET /api/payments/razorpay-payments?count=10&skip=10
 * 
 * @note Test accounts have a limit of 10 items per request. Use fetchAll=true to get all payments.
 * @note When count is limited, response includes X-Count-Limited and X-Max-Count headers.
 * @note Regular users will only see their own payments. Admins see all payments.
 */

export const runtime = 'nodejs';

export const GET = withApiHandler(
  async (request, { user }) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    
    // Enhanced credential validation
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('[razorpay/payments] Missing credentials:', {
        hasKeyId: !!RAZORPAY_KEY_ID,
        hasKeySecret: !!RAZORPAY_KEY_SECRET,
      });
      return errorResponse('Missing Razorpay credentials', 500);
    }

    // Validate key format
    if (!RAZORPAY_KEY_ID.startsWith('rzp_test_') && !RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
      console.error('[razorpay/payments] Invalid key format:', RAZORPAY_KEY_ID.substring(0, 10) + '...');
      return errorResponse('Invalid Razorpay key format', 500);
    }

    const isAdminUser = await isAdmin(user!.id);
    console.log(`[razorpay/payments] Fetching payments for user: ${user?.id} (admin: ${isAdminUser}), key: ${RAZORPAY_KEY_ID.substring(0, 15)}...`);

    const url = new URL(request.url);
    const requestedCount = url.searchParams.get('count') ? Number(url.searchParams.get('count')) : 10;
    const skip = url.searchParams.get('skip') ? Number(url.searchParams.get('skip')) : 0;
    const from = url.searchParams.get('from') ? Number(url.searchParams.get('from')) : undefined;
    const to = url.searchParams.get('to') ? Number(url.searchParams.get('to')) : undefined;
    const fetchAll = url.searchParams.get('fetchAll') === 'true';
    // optional search query (id, order_id, email)
    const q = url.searchParams.get('q') || undefined;

    // Razorpay API has a limit of 10-100 items per request
    // Test accounts may have lower limits (observed: max ~10-12 items)
    const MAX_COUNT = 10; // Safe limit for test accounts
    const count = Math.min(requestedCount, MAX_COUNT);
    
    if (requestedCount > MAX_COUNT && !fetchAll) {
      console.log(`[razorpay/payments] Count reduced from ${requestedCount} to ${count} (max limit)`);
    }

    const razorpay = new Razorpay({ 
      key_id: RAZORPAY_KEY_ID, 
      key_secret: RAZORPAY_KEY_SECRET 
    });

    // If fetchAll is true, fetch all payments across multiple pages
    if (fetchAll) {
      console.log('[razorpay/payments] Fetching ALL payments with auto-pagination...');
      
      const allItems: unknown[] = [];
      let currentSkip = 0;
      let hasMore = true;
      let pageCount = 0;
      const maxPages = 100; // Safety limit to prevent infinite loops

      while (hasMore && pageCount < maxPages) {
        const params: Record<string, unknown> = { count: MAX_COUNT, skip: currentSkip };
        if (from) params.from = from;
        if (to) params.to = to;

        console.log(`[razorpay/payments] Fetching page ${pageCount + 1} (skip: ${currentSkip})...`);
        
        const pageData = await razorpay.payments.all(params);
        const items = pageData?.items || [];
        
        allItems.push(...items);
        pageCount++;
        
        // Check if there are more items
        if (items.length < MAX_COUNT) {
          hasMore = false;
          console.log('[razorpay/payments] No more items to fetch');
        } else {
          currentSkip += MAX_COUNT;
        }
      }

      console.log(`[razorpay/payments] Fetched total of ${allItems.length} payments across ${pageCount} pages`);

      // Apply authorization filtering
      const authorizedItems = await filterPaymentsForUser(
        user!.id,
        allItems as Record<string, unknown>[]
      );
      console.log(`[razorpay/payments] Filtered to ${authorizedItems.length} payments after authorization`);

      // Apply search filter if provided
      let finalItems = authorizedItems;
      if (q) {
        const ql = q.toLowerCase();
        finalItems = authorizedItems.filter((p) => {
          const obj = p as Record<string, unknown>;
          const id = typeof obj.id === 'string' ? obj.id.toLowerCase() : '';
          const order_id = obj.order_id ? String(obj.order_id).toLowerCase() : '';
          const email = typeof obj.email === 'string' ? obj.email.toLowerCase() : '';
          return id.includes(ql) || order_id.includes(ql) || email.includes(ql);
        });
        console.log(`[razorpay/payments] Filtered to ${finalItems.length} payments with query: ${q}`);
      }

      const response = NextResponse.json({
        entity: 'collection',
        count: finalItems.length,
        items: finalItems,
        _fetchAll: true,
        _pages: pageCount,
        isAdmin: isAdminUser,
        _note: `Fetched all ${allItems.length} payments across ${pageCount} pages${q ? ` (filtered to ${finalItems.length})` : ''}`
      });

      return response;
    }

    // Single page fetch (original behavior)
    const params: Record<string, unknown> = { count, skip };
    if (from) params.from = from;
    if (to) params.to = to;
    // The SDK doesn't support q, so we fetch and filter client-side if needed

    console.log('[razorpay/payments] Fetching with params:', params);

    const payments = await razorpay.payments.all(params);

    console.log('[razorpay/payments] Success - fetched', payments?.items?.length || 0, 'payments');

    // Apply authorization filtering
    let authorizedItems = (payments?.items || []) as unknown[];
    if (!isAdminUser) {
      authorizedItems = await filterPaymentsForUser(user!.id, authorizedItems as Record<string, unknown>[]);
      console.log(`[razorpay/payments] User ${user!.id} authorized to see ${authorizedItems.length} payments out of ${payments?.items?.length || 0}`);
    }

    // If q provided, do a simple in-memory filter across id, order_id, email
    if (q && authorizedItems.length > 0) {
      const ql = q.toLowerCase();
      const filtered = authorizedItems.filter((p) => {
        const obj = p as Record<string, unknown>;
        const id = typeof obj.id === 'string' ? obj.id.toLowerCase() : '';
        const order_id = obj.order_id ? String(obj.order_id).toLowerCase() : '';
        const email = typeof obj.email === 'string' ? obj.email.toLowerCase() : '';
        return id.includes(ql) || order_id.includes(ql) || email.includes(ql);
      });
      console.log('[razorpay/payments] Filtered', filtered.length, 'payments with query:', q);
      
      const response = NextResponse.json({ 
        entity: 'collection', 
        count: filtered.length, 
        items: filtered,
        isAdmin: isAdminUser,
        ...(requestedCount > MAX_COUNT && { 
          _note: `Count limited to ${MAX_COUNT} items per request (requested: ${requestedCount})` 
        })
      });
      
      if (requestedCount > MAX_COUNT) {
        response.headers.set('X-Count-Limited', 'true');
        response.headers.set('X-Max-Count', MAX_COUNT.toString());
      }
      
      return response;
    }

    const response = NextResponse.json({
      entity: 'collection',
      count: authorizedItems.length,
      items: authorizedItems,
      isAdmin: isAdminUser,
      ...(requestedCount > MAX_COUNT && { 
        _note: `Count limited to ${MAX_COUNT} items per request (requested: ${requestedCount})` 
      })
    });
    
    if (requestedCount > MAX_COUNT) {
      response.headers.set('X-Count-Limited', 'true');
      response.headers.set('X-Max-Count', MAX_COUNT.toString());
    }

    return response;
  },
  { requireAuth: true }
);
