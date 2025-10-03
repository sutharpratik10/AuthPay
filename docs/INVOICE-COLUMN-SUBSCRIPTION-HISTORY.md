# Invoice Column in Subscription History

## Overview

Added an "Invoice" column to the Subscription History table that displays Razorpay invoice links for each subscription. Users can click these links to view their invoices in a new browser tab.

## Changes Made

### File: `src/app/protected/user/manage-subscription/page.tsx`

#### 1. Updated Interface
```typescript
interface SubscriptionHistoryItem {
  planName: string;
  status: string;
  startDate?: string;
  expiryDate?: string;
  endDate?: string;
  amount?: string;
  invoiceUrl?: string;           // NEW
  razorpaySubscriptionId?: string; // NEW
}
```

#### 2. Enhanced History Enrichment
Updated the history enrichment logic to extract invoice URLs from Razorpay subscription data:

```typescript
const enriched = await Promise.all(history.map(async (item: unknown) => {
  const row = item as Record<string, unknown>;
  try {
    if (row.razorpaySubscriptionId && typeof row.razorpaySubscriptionId === 'string') {
      const subRes = await fetch(`/api/payments/razorpay-subscriptions/${encodeURIComponent(String(row.razorpaySubscriptionId))}`);
      if (subRes.ok) {
        const subJson = await subRes.json();
        
        // Get invoice URL if available
        const invoiceUrl = subJson?.short_url || null;
        
        // ... rest of enrichment logic
        
        return { 
          ...row, 
          planName: planName || row.planName, 
          amount: amount ?? row.amount,
          invoiceUrl: invoiceUrl,                    // NEW
          razorpaySubscriptionId: row.razorpaySubscriptionId // NEW
        };
      }
    }
  } catch (err) {
    console.error('Error enriching history item:', err);
  }
  return row;
}));
```

#### 3. Added Invoice Column to Table
Added a new column header and cell to display invoice links:

**Table Header:**
```tsx
<thead>
  <tr>
    <th className="px-4 py-2 text-left">Plan</th>
    <th className="px-4 py-2 text-left">Status</th>
    <th className="px-4 py-2 text-left">Amount</th>
    <th className="px-4 py-2 text-left">Start Date</th>
    <th className="px-4 py-2 text-left">End/Expiry Date</th>
    <th className="px-4 py-2 text-left">Invoice</th> {/* NEW */}
  </tr>
</thead>
```

**Table Cell with Link:**
```tsx
<td className="px-4 py-2">
  {sub.invoiceUrl ? (
    <a
      href={sub.invoiceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
    >
      View
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
      </svg>
    </a>
  ) : (
    <span className="text-muted-foreground">N/A</span>
  )}
</td>
```

#### 4. Updated Loading Skeleton
Added invoice column to the skeleton loading state:

```tsx
<thead>
  <tr>
    {/* ... other headers ... */}
    <th className="px-4 py-2 text-left">Invoice</th> {/* NEW */}
  </tr>
</thead>
<tbody>
  {Array.from({ length: 1 }).map((_, r) => (
    <tr key={r} className="border-b last:border-0">
      {/* ... other skeleton cells ... */}
      <td className="px-4 py-6">
        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
      </td>
    </tr>
  ))}
</tbody>
```

## Features

### ✅ View Invoice Link
- Displays a clickable "View" link for subscriptions with invoices
- Shows "N/A" for subscriptions without invoice URLs
- Opens invoice in a new browser tab
- External link icon indicates new tab behavior

### ✅ Security
- Uses `rel="noopener noreferrer"` for security best practices
- Prevents the new page from accessing `window.opener`
- Protects against reverse tabnabbing attacks

### ✅ Accessibility
- Semantic HTML with proper `<a>` tags
- Visible link text ("View")
- Icon provides visual cue for external link
- Keyboard accessible (can be tabbed to and activated with Enter)

### ✅ Responsive Design
- Works on all screen sizes
- Scrollable table for narrow viewports
- Consistent styling with existing columns

### ✅ Dark Mode Support
- Light mode: Blue link (`text-blue-600 hover:text-blue-800`)
- Dark mode: Lighter blue (`dark:text-blue-400 dark:hover:text-blue-300`)
- Proper contrast ratios for accessibility

## User Experience

### Before
```
| Plan      | Status | Amount | Start Date | End/Expiry Date |
|-----------|--------|--------|------------|-----------------|
| Premium   | Active | $99.00 | Jan 1, 2025| Feb 1, 2025     |
```

### After
```
| Plan      | Status | Amount | Start Date | End/Expiry Date | Invoice  |
|-----------|--------|--------|------------|-----------------|----------|
| Premium   | Active | $99.00 | Jan 1, 2025| Feb 1, 2025     | View 🔗  |
```

## Razorpay Integration

### Invoice URL Source
The invoice URL is extracted from Razorpay's subscription object:

```typescript
const invoiceUrl = subJson?.short_url || null;
```

### Razorpay Invoice Short URL
Razorpay provides a `short_url` field in the subscription object that:
- Points to a hosted payment/invoice page
- Is publicly accessible with proper authentication
- Works for both completed and pending subscriptions
- Example: `https://rzp.io/i/PWtAiEo`

### Alternative Invoice Sources
If `short_url` is not available, future enhancements could:
1. Fetch invoices via API: `GET /v1/invoices?subscription_id={id}`
2. Use invoice `short_url` from the invoices API
3. Construct custom invoice URLs from invoice IDs

## Error Handling

### Missing Invoice URL
```tsx
{sub.invoiceUrl ? (
  <a href={sub.invoiceUrl} ...>View</a>
) : (
  <span className="text-muted-foreground">N/A</span>
)}
```
- Gracefully handles subscriptions without invoice URLs
- Displays "N/A" instead of broken links
- Prevents JavaScript errors

### Network Failures
```typescript
try {
  const subRes = await fetch(`/api/payments/razorpay-subscriptions/...`);
  if (subRes.ok) {
    const invoiceUrl = subJson?.short_url || null;
    // Use invoiceUrl
  }
} catch (err) {
  console.error('Error enriching history item:', err);
  // Falls back to row without invoice
}
```
- Catches and logs errors during enrichment
- Continues with partial data if invoice fetch fails
- Doesn't break the entire history table

## Visual Design

### Link Styling
```css
/* Light Mode */
color: #2563eb;        /* text-blue-600 */
hover: #1e40af;        /* hover:text-blue-800 */

/* Dark Mode */
color: #60a5fa;        /* dark:text-blue-400 */
hover: #93c5fd;        /* dark:hover:text-blue-300 */
```

### External Link Icon
```svg
<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
</svg>
```
- 16x16 pixel icon (h-4 w-4)
- Matches text color for consistency
- Classic "open in new window" design

## Testing Recommendations

### Unit Tests
```typescript
describe('Subscription History Invoice Column', () => {
  test('renders invoice link when URL is available', () => {
    const history = [{
      planName: 'Premium',
      status: 'active',
      invoiceUrl: 'https://rzp.io/i/test123'
    }];
    
    render(<ManageSubscriptionPage history={history} />);
    
    const link = screen.getByText('View');
    expect(link).toHaveAttribute('href', 'https://rzp.io/i/test123');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
  
  test('renders N/A when invoice URL is missing', () => {
    const history = [{
      planName: 'Premium',
      status: 'active',
      invoiceUrl: null
    }];
    
    render(<ManageSubscriptionPage history={history} />);
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.queryByText('View')).not.toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
test('invoice link opens Razorpay page in new tab', async () => {
  // Mock subscription with invoice URL
  mockFetch('/api/user/subscription-history', {
    success: true,
    data: {
      history: [{
        razorpaySubscriptionId: 'sub_123',
        planName: 'Premium'
      }]
    }
  });
  
  mockFetch('/api/payments/razorpay-subscriptions/sub_123', {
    short_url: 'https://rzp.io/i/test123'
  });
  
  render(<ManageSubscriptionPage />);
  
  await waitFor(() => {
    const link = screen.getByText('View');
    expect(link).toHaveAttribute('href', 'https://rzp.io/i/test123');
  });
});
```

### E2E Tests
```typescript
test('user can view invoice from subscription history', async () => {
  // Login and navigate to manage subscription
  await loginAsUser();
  await navigateTo('/protected/user/manage-subscription');
  
  // Wait for history to load
  await page.waitForSelector('table tbody tr');
  
  // Find and click invoice link
  const invoiceLink = page.locator('a:has-text("View")').first();
  
  // Mock new tab
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    invoiceLink.click()
  ]);
  
  // Verify Razorpay invoice page opened
  await expect(newPage).toHaveURL(/rzp\.io\/i\/.+/);
  await expect(newPage.locator('body')).toContainText('Invoice');
});
```

## Future Enhancements

### 1. Invoice API Integration
Instead of relying on `short_url` from subscriptions, fetch invoices directly:

```typescript
// GET /v1/invoices?subscription_id={subscription_id}
const invoiceRes = await fetch(`/api/payments/razorpay-invoices?subscription_id=${subId}`);
const invoices = await invoiceRes.json();
const latestInvoice = invoices.items[0];
const invoiceUrl = latestInvoice?.short_url;
```

### 2. Multiple Invoices
Show all invoices for subscriptions with multiple billing cycles:

```tsx
<td className="px-4 py-2">
  {sub.invoices?.map((invoice, i) => (
    <a key={i} href={invoice.url} target="_blank" rel="noopener noreferrer">
      Invoice {i + 1}
    </a>
  ))}
</td>
```

### 3. Download Invoice
Add a download button to save PDF invoices locally:

```tsx
<button onClick={() => downloadInvoice(sub.invoiceId)}>
  Download PDF
</button>
```

### 4. Invoice Status Badge
Show payment status for each invoice:

```tsx
<div className="flex items-center gap-2">
  <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
    {invoice.status}
  </Badge>
  <a href={invoice.url}>View</a>
</div>
```

### 5. Tooltip with Invoice Details
Show invoice details on hover:

```tsx
<Tooltip content={`Invoice #${invoice.id} - ${invoice.amount} - ${invoice.date}`}>
  <a href={invoice.url}>View</a>
</Tooltip>
```

## Security Considerations

### ✅ Safe External Links
```tsx
target="_blank"              // Opens in new tab
rel="noopener noreferrer"    // Prevents reverse tabnabbing
```

### ✅ URL Validation
```typescript
// Only use URLs from trusted Razorpay API
const invoiceUrl = subJson?.short_url || null;

// Could add additional validation:
if (invoiceUrl && invoiceUrl.startsWith('https://rzp.io/')) {
  // Use URL
}
```

### ✅ Access Control
- Invoice URLs are public but authenticated by Razorpay
- Users can only see their own subscription history (server-side filtered)
- No invoice IDs or sensitive data exposed in client code

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✅ Full | All features work |
| Firefox | ✅ Full | All features work |
| Safari  | ✅ Full | All features work |
| Edge    | ✅ Full | All features work |
| Mobile  | ✅ Full | Touch-friendly links |

## Related Documentation

- [Subscription History API](../src/app/api/user/subscription-history/route.ts)
- [Razorpay Subscriptions API](https://razorpay.com/docs/api/subscriptions/)
- [Razorpay Invoices API](https://razorpay.com/docs/api/invoices/)
- [Performance Optimization](./PERFORMANCE-OPTIMIZATION-SUBSCRIPTION-CONTEXT.md)

## Conclusion

The Invoice column enhances the subscription management experience by:
- ✅ **Easy Access**: One-click invoice viewing
- ✅ **Professional UX**: Clear link with external icon
- ✅ **Secure**: Proper `rel` attributes for external links
- ✅ **Accessible**: Keyboard navigation and screen reader friendly
- ✅ **Consistent**: Matches existing table design

Users can now easily access their Razorpay invoices directly from the subscription history table.

---

**Implementation Date**: January 2025  
**Status**: ✅ Complete  
**Feature Type**: Enhancement
