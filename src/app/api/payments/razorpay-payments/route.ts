import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

/**
 * Razorpay Payments API
 * 
 * Fetches payment transactions from Razorpay with pagination and filtering.
 * 
 * @endpoint GET /api/payments/razorpay-payments
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
 */

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    
    // Enhanced credential validation
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('[razorpay/payments] Missing credentials:', {
        hasKeyId: !!RAZORPAY_KEY_ID,
        hasKeySecret: !!RAZORPAY_KEY_SECRET,
      });
      return NextResponse.json({ 
        success: false, 
        error: { description: 'Missing Razorpay credentials' } 
      }, { status: 500 });
    }

    // Validate key format
    if (!RAZORPAY_KEY_ID.startsWith('rzp_test_') && !RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
      console.error('[razorpay/payments] Invalid key format:', RAZORPAY_KEY_ID.substring(0, 10) + '...');
      return NextResponse.json({ 
        success: false, 
        error: { description: 'Invalid Razorpay key format' } 
      }, { status: 500 });
    }

    console.log('[razorpay/payments] Using key:', RAZORPAY_KEY_ID.substring(0, 15) + '...');

    const url = new URL(req.url);
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

      // Apply search filter if provided
      let finalItems = allItems;
      if (q) {
        const ql = q.toLowerCase();
        finalItems = allItems.filter((p) => {
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

    // If q provided, do a simple in-memory filter across id, order_id, email
    if (q && payments && Array.isArray(payments.items)) {
      const ql = q.toLowerCase();
      const items = payments.items as unknown[];
      const filtered = items.filter((p) => {
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
      ...payments,
      ...(requestedCount > MAX_COUNT && { 
        _note: `Count limited to ${MAX_COUNT} items per request (requested: ${requestedCount})` 
      })
    });
    
    if (requestedCount > MAX_COUNT) {
      response.headers.set('X-Count-Limited', 'true');
      response.headers.set('X-Max-Count', MAX_COUNT.toString());
    }

    return response;
  } catch (err) {
    // Enhanced error logging
    console.error('[razorpay/payments] error:', err);
    
    // Log detailed error information
    if (err && typeof err === 'object') {
      const error = err as { statusCode?: number; error?: unknown; message?: string; stack?: string };
      console.error('[razorpay/payments] error details:', {
        statusCode: error.statusCode,
        error: error.error,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });
    }

    const message = (err instanceof Error) ? err.message : 'Failed to fetch payments';
    const error = err as { error?: { description?: string } };
    const errorResponse = error?.error || { description: message };
    
    return NextResponse.json({ 
      success: false, 
      error: errorResponse 
    }, { status: 500 });
  }
}
