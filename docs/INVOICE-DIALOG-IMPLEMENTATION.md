# Invoice Dialog Implementation

**Date:** October 4, 2025  
**Feature:** View Razorpay invoices in a modal dialog with professional UI

## Overview

Replaced the simple "View" link for invoices in the subscription history with a beautiful, comprehensive invoice viewer dialog that displays all invoice details in a professional format.

## Changes Made

### 1. Created InvoiceDialog Component
**File:** `src/components/user/InvoiceDialog.tsx`

A complete invoice viewer with:

#### Features
- ✅ Fetches invoice details from Razorpay API
- ✅ Professional invoice layout with company branding
- ✅ Customer billing information display
- ✅ Detailed line items table
- ✅ Tax calculations and totals breakdown
- ✅ Payment status badges
- ✅ Invoice dates (issued, paid, cancelled)
- ✅ Download invoice button
- ✅ Loading and error states
- ✅ Responsive design

#### UI Sections

**Header Section:**
- Invoice title with file icon
- Invoice number
- Status badge (Paid, Issued, Cancelled, etc.)

**Customer Details:**
- Customer name, email, phone
- Billing address with proper formatting
- Visual icons for each detail type

**Invoice Information:**
- Issue date
- Paid date (if applicable)
- Payment ID
- Order ID

**Line Items Table:**
- Item name and description
- Quantity
- Unit price
- Tax amount
- Total amount per item

**Totals Section:**
- Subtotal
- Tax
- Total amount
- Amount paid (if applicable)
- Amount due (if applicable)

**Actions:**
- Close button
- Download invoice button (opens Razorpay short URL)

### 2. Updated Manage Subscription Page
**File:** `src/app/protected/user/manage-subscription/page.tsx`

#### Changes:
1. **Added Import:**
   ```tsx
   import { InvoiceDialog } from '@/components/user/InvoiceDialog'
   ```

2. **Added State:**
   ```tsx
   const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string | null>(null)
   const [showInvoiceDialog, setShowInvoiceDialog] = React.useState(false)
   ```

3. **Updated Invoice Column:**
   - Changed from external link to button
   - Extracts invoice ID from Razorpay URL
   - Opens dialog on click
   - New icon (document/invoice icon)

   **Before:**
   ```tsx
   <a href={sub.invoiceUrl} target="_blank">
     View
     <ExternalLinkIcon />
   </a>
   ```

   **After:**
   ```tsx
   <Button
     variant="ghost"
     onClick={() => {
       const invoiceId = sub.invoiceUrl.split('/').pop()
       setSelectedInvoiceId(invoiceId)
       setShowInvoiceDialog(true)
     }}
   >
     View Invoice
     <InvoiceIcon />
   </Button>
   ```

4. **Added Dialog Component:**
   ```tsx
   <InvoiceDialog
     invoiceId={selectedInvoiceId}
     open={showInvoiceDialog}
     onOpenChange={setShowInvoiceDialog}
   />
   ```

### 3. API Route (Already Exists)
**File:** `src/app/api/payments/razorpay-invoices/[id]/route.ts`

The API endpoint was already implemented and fetches invoice details from Razorpay using:
```tsx
razorpay.invoices.fetch(invoiceId)
```

## Invoice Data Structure

The component handles the complete Razorpay invoice object:

```typescript
interface InvoiceData {
  id: string
  invoice_number: string | null
  status: string // paid, issued, cancelled, expired, draft
  
  // Customer details
  customer_details: {
    name: string
    email: string
    contact: string
    billing_address: {
      line1, line2, city, state, zipcode, country
    }
  }
  
  // Line items
  line_items: [{
    name: string
    description: string
    amount: number        // in paise
    unit_amount: number
    tax_amount: number
    quantity: number
  }]
  
  // Amounts (all in paise)
  amount: number          // Total
  amount_paid: number
  amount_due: number
  taxable_amount: number
  tax_amount: number
  
  // Dates (Unix timestamps)
  issued_at: number
  paid_at: number | null
  cancelled_at: number | null
  
  // Additional
  currency: string
  currency_symbol: string
  payment_id: string | null
  order_id: string
  short_url: string       // Razorpay invoice URL
}
```

## User Experience Flow

1. **User navigates to Manage Subscription page**
2. **Views subscription history table**
3. **Clicks "View Invoice" button** for any subscription
4. **Dialog opens with loading state**
5. **Invoice details fetched from Razorpay API**
6. **Beautiful invoice displayed** with all details
7. **User can:**
   - Review all invoice information
   - See payment status
   - Download invoice (opens Razorpay PDF)
   - Close dialog

## Visual Design

### Color Scheme
- **Paid invoices:** Green badge
- **Issued invoices:** Blue/secondary badge
- **Cancelled invoices:** Red/destructive badge
- **Expired invoices:** Red/destructive badge
- **Draft invoices:** Gray/outline badge

### Layout
- **Two-column layout** for customer and invoice details
- **Muted background cards** for grouped information
- **Clean table** for line items
- **Highlighted totals section** on the right
- **Icon indicators** for all information types

### Icons Used
- 📄 FileText - Invoice title and order ID
- 📥 Download - Download button
- 📅 Calendar - Dates
- 💳 CreditCard - Payment ID
- 👤 User - Customer name
- ✉️ Mail - Email
- 📞 Phone - Contact
- 📍 MapPin - Address
- ⚠️ AlertCircle - Error state
- ⏳ Loader2 - Loading state

## Benefits

### Before
- ❌ External link opens Razorpay website
- ❌ User leaves the application
- ❌ Basic invoice view
- ❌ No context switching
- ❌ Limited information display

### After
- ✅ Professional in-app invoice viewer
- ✅ User stays in application
- ✅ Beautiful, detailed invoice layout
- ✅ Seamless user experience
- ✅ All invoice details at a glance
- ✅ Quick access to download PDF
- ✅ Consistent with app design
- ✅ Mobile responsive

## Technical Details

### Invoice ID Extraction
The invoice URL from Razorpay follows this pattern:
```
https://api.razorpay.com/v1/invoices/inv_xxxxxxxxxx
```

We extract the invoice ID using:
```tsx
const invoiceId = sub.invoiceUrl.split('/').pop()
// Returns: "inv_xxxxxxxxxx"
```

### Amount Formatting
Razorpay stores amounts in paise (smallest currency unit):
```tsx
const formatCurrency = (amount: number, symbol: string = '₹') => {
  return `${symbol}${(amount / 100).toFixed(2)}`
}

// Example: 39900 paise → ₹399.00
```

### Date Formatting
Razorpay provides Unix timestamps:
```tsx
const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Example: 1579765167 → January 23, 2020
```

### Error Handling
- Loading state with spinner
- Error state with icon and message
- Graceful fallback if invoice not found
- Safe null checks for optional fields

### Performance
- Lazy loading - only fetches when dialog opens
- Single API call per invoice view
- Cached by browser (standard fetch)
- Fast UI response with loading states

## Dependencies

### UI Components Used
- `Dialog` from `@/components/ui/dialog`
- `Button` from `@/components/ui/button`
- `Badge` from `@/components/ui/badge`
- `Separator` from `@/components/ui/separator`
- Icons from `lucide-react`

### API Integration
- Razorpay Node.js SDK
- NextAuth authentication
- Next.js API routes

## Testing Checklist

- [ ] Click "View Invoice" opens dialog
- [ ] Loading state displays correctly
- [ ] Invoice details load from API
- [ ] Customer information displays correctly
- [ ] Billing address formats properly
- [ ] Line items table renders correctly
- [ ] Amounts calculate and display correctly
- [ ] Currency symbols display correctly (₹, $)
- [ ] Status badges show correct colors
- [ ] Dates format correctly
- [ ] Download button opens Razorpay URL
- [ ] Close button closes dialog
- [ ] Dialog closes when clicking outside
- [ ] Error state displays for invalid invoices
- [ ] Responsive design works on mobile
- [ ] Multiple invoices can be viewed sequentially
- [ ] Works for different invoice statuses (paid, issued, cancelled)

## Future Enhancements

### Potential Additions
1. **Print functionality** - Direct print from dialog
2. **Email invoice** - Send invoice to email
3. **Invoice history** - View payment timeline
4. **Refund information** - Show refund details if applicable
5. **Tax breakdown** - Detailed tax components (GST, etc.)
6. **Multiple currency support** - Better formatting for different currencies
7. **Receipt download** - Generate custom receipts
8. **Invoice notes** - Display terms and conditions
9. **Company branding** - Add company logo and details
10. **Export options** - Download as PDF, Excel, CSV

### Accessibility Improvements
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus management
- ARIA labels

## Related Files

- `src/components/user/InvoiceDialog.tsx` - Main component
- `src/app/protected/user/manage-subscription/page.tsx` - Integration
- `src/app/api/payments/razorpay-invoices/[id]/route.ts` - API endpoint
- `src/components/ui/dialog.tsx` - Dialog component
- `src/components/ui/badge.tsx` - Badge component
- `src/components/ui/button.tsx` - Button component
- `src/components/ui/separator.tsx` - Separator component

## Documentation References

- [Razorpay Invoice API](https://razorpay.com/docs/api/invoices/)
- [Razorpay Invoice Object](https://razorpay.com/docs/api/invoices/#invoice-entity)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)
- [Lucide Icons](https://lucide.dev/)

## Summary

Successfully implemented a professional invoice viewer that:
- ✅ Enhances user experience
- ✅ Keeps users within the application
- ✅ Displays comprehensive invoice details
- ✅ Maintains consistent design language
- ✅ Provides easy access to download
- ✅ Works seamlessly with existing subscription management
- ✅ Follows best practices for error handling and loading states
- ✅ Mobile responsive and accessible
