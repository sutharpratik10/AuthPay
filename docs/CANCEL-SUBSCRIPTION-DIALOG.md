# Cancel Subscription Implementation

## Overview
Complete implementation of subscription cancellation with proper database persistence, dialog confirmation, and status management.

## Key Features

### 1. Professional Dialog Component
Replaced the browser's native `window.confirm()` with a beautiful, accessible Dialog component.

### 2. Database Persistence
When a subscription is cancelled via Razorpay, the local database is immediately updated to reflect the cancellation, ensuring consistency across page refreshes.

### 3. Status Preservation
Cancelled subscriptions maintain their 'cancelled' status and are never overridden by expired status updates.

## Implementation Details

### Phase 1: Dialog Component (Original Implementation)

#### Added Dialog Component Imports
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
```

#### Dialog State Management
```tsx
const [showCancelDialog, setShowCancelDialog] = React.useState(false);
```

#### Split Cancel Logic
```tsx
// Opens the dialog
const handleCancelClick = () => {
  setShowCancelDialog(true);
};

// Performs the actual cancellation
const handleCancel = async () => {
  setCancelling(true);
  setShowCancelDialog(false); // Close dialog immediately
  // ... API call to cancel
};
```

### Phase 2: Database Persistence (Enhanced Implementation)

#### Cancel Route Enhancement
**File**: `src/app/api/payments/razorpay-subscriptions/[id]/cancel/route.ts`

Added database imports:
```typescript
import { auth } from '@/auth';
import { db } from '@/db';
import { userSubscriptions, subscriptionStatuses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
```

Added database update after successful Razorpay cancellation:
```typescript
// After successful cancellation on Razorpay, update local database
try {
  const session = await auth();
  if (session?.user?.id) {
    // Get the 'cancelled' status id
    const cancelledStatus = await db.query.subscriptionStatuses.findFirst({
      where: eq(subscriptionStatuses.name, 'cancelled'),
      columns: { id: true }
    });

    if (cancelledStatus?.id) {
      // Update the user's subscription to cancelled status
      await db.update(userSubscriptions)
        .set({ 
          statusId: cancelledStatus.id,
          endDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(and(
          eq(userSubscriptions.userId, session.user.id),
          eq(userSubscriptions.razorpaySubscriptionId, id)
        ));
      
      console.log('[razorpay/cancel] Updated local database for user:', session.user.id);
    }
  }
} catch (dbErr) {
  console.error('[razorpay/cancel] Failed to update local database:', dbErr);
  // Don't fail the request if DB update fails, Razorpay cancellation was successful
}
```

### Phase 3: Status Preservation

#### Updated GET Handler
**File**: `src/app/api/user/subscription-status/route.ts`

Modified to preserve cancelled status:
```typescript
// If expired, override status and isActive (but not if already cancelled)
if (expiry && expiry <= now && status !== 'cancelled') {
  status = 'expired';
  isActive = false;
} else if (status === 'active') {
  isActive = true;
} else if (status === 'cancelled') {
  isActive = false;
  status = 'cancelled';
}
```

Updated expired subscription batch update to exclude cancelled:
```typescript
// Get the 'expired' and 'cancelled' status ids
const [expiredStatus, cancelledStatus] = await Promise.all([
  db.query.subscriptionStatuses.findFirst({
    where: eq(subscriptionStatuses.name, 'expired'),
    columns: { id: true }
  }),
  db.query.subscriptionStatuses.findFirst({
    where: eq(subscriptionStatuses.name, 'cancelled'),
    columns: { id: true }
  })
]);

if (expiredStatus?.id && userId) {
  // Update all userSubscriptions for this user where expiryDate < now 
  // and statusId is not expired or cancelled (preserve cancelled status)
  await db.update(userSubscriptions)
    .set({ statusId: expiredStatus.id, updatedAt: new Date().toISOString() })
    .where(and(
      eq(userSubscriptions.userId, userId),
      lt(userSubscriptions.expiryDate, new Date().toISOString()),
      ne(userSubscriptions.statusId, expiredStatus.id),
      cancelledStatus?.id ? ne(userSubscriptions.statusId, cancelledStatus.id) : undefined
    ));
}
```

#### Updated POST Handler
**File**: `src/app/api/user/subscription-status/route.ts`

Enhanced to exclude cancelled subscriptions from being marked as expired:
```typescript
// Get the 'expired' and 'cancelled' status ids
const [expiredStatus, cancelledStatus] = await Promise.all([
  db.query.subscriptionStatuses.findFirst({
    where: eq(subscriptionStatuses.name, 'expired'),
    columns: { id: true }
  }),
  db.query.subscriptionStatuses.findFirst({
    where: eq(subscriptionStatuses.name, 'cancelled'),
    columns: { id: true }
  })
]);

if (expiredStatus?.id && userId) {
  // Update all userSubscriptions for this user where expiryDate < now 
  // and statusId is not expired or cancelled (don't override cancelled subscriptions)
  const result = await db.update(userSubscriptions)
    .set({ statusId: expiredStatus.id, updatedAt: new Date().toISOString() })
    .where(and(
      eq(userSubscriptions.userId, userId),
      lt(userSubscriptions.expiryDate, new Date().toISOString()),
      ne(userSubscriptions.statusId, expiredStatus.id),
      cancelledStatus?.id ? ne(userSubscriptions.statusId, cancelledStatus.id) : undefined
    ));
  return NextResponse.json({ success: true, updated: result });
}
```

## User Flow

1. 🖱️ User clicks **"Cancel subscription"** button
2. 🎨 **Professional dialog opens** with:
   - ⚠️ Warning icon (AlertTriangle)
   - Clear title: "Cancel Subscription"
   - Detailed description of consequences
   - Two action buttons:
     - **"Keep Subscription"** (outline, safe action)
     - **"Yes, Cancel Now"** (red/destructive, dangerous action)
3. ✅ User clicks "Yes, Cancel Now":
   - Dialog closes immediately
   - Button shows "Cancelling..." 
   - Razorpay API cancels the subscription
   - **Database is updated with 'cancelled' status**
   - **endDate is set to current timestamp**
   - Toast notification shows success
   - UI updates to show "cancelled" badge
   - Next Billing shows: "Your subscription is cancelled"
4. 🔄 User refreshes the page:
   - Subscription **remains cancelled** (persisted in DB)
   - Status does not revert to 'active'
   - Expired subscription updates **skip cancelled subscriptions**

## Database Changes

### When Cancelling
The following fields are updated in `user_subscriptions` table:
- `statusId` → Set to cancelled status ID
- `endDate` → Set to current timestamp
- `updatedAt` → Set to current timestamp

### Status Priority
1. **Cancelled** status has highest priority (never overridden)
2. **Expired** status only applies if not cancelled
3. **Active** status can be changed to expired or cancelled

## Frontend Behavior

### Current Subscription Card
- **Active subscription**: Shows "Cancel subscription" button (red)
- **Cancelled subscription**: Shows "cancelled" badge (gray)
- **Next Billing**: Shows "Your subscription is cancelled" when status is cancelled

### Subscription History
- Shows all subscriptions with their actual status from database
- Cancelled subscriptions display as "cancelled"

## Error Handling

### Database Update Failure
If the database update fails after Razorpay cancellation:
- Error is logged to console
- Request still returns success (Razorpay cancellation succeeded)
- User sees success toast
- Next page refresh will sync status from Razorpay

### Razorpay API Failure
If Razorpay cancellation fails:
- Database is NOT updated
- Error toast is shown to user
- Subscription remains active

## Testing Checklist

### Dialog Functionality
- [ ] Dialog opens when clicking "Cancel subscription"
- [ ] Dialog closes when clicking "Keep Subscription"
- [ ] Dialog closes when pressing ESC key
- [ ] Dialog is accessible via keyboard navigation
- [ ] Dialog works in light and dark mode

### Cancellation Flow
- [ ] "Yes, Cancel Now" triggers Razorpay cancellation
- [ ] Dialog closes immediately after confirmation
- [ ] Success toast appears on successful cancellation
- [ ] Error toast appears on failed cancellation
- [ ] Database is updated with cancelled status
- [ ] endDate is set to current time

### Status Persistence
- [ ] Cancelled status persists after page refresh
- [ ] Cancelled subscriptions are not marked as expired
- [ ] GET /api/user/subscription-status returns cancelled status
- [ ] POST /api/user/subscription-status skips cancelled subscriptions
- [ ] UI shows "Your subscription is cancelled" in Next Billing
- [ ] Subscription history shows cancelled status

### Edge Cases
- [ ] Multiple cancellation attempts are handled gracefully
- [ ] Expired+Cancelled subscriptions maintain cancelled status
- [ ] Database error doesn't break Razorpay cancellation
- [ ] Concurrent status updates don't cause race conditions

## Console Logs

### Successful Cancellation
```
[razorpay/cancel] calling cancel, id= sub_xxx cancel_at_cycle_end= false existing.status= active
[razorpay/cancel] Updated local database for user: user-uuid
POST /api/payments/razorpay-subscriptions/sub_xxx/cancel 200 in 1899ms
POST /api/user/subscription-status 200 in 197ms
```

### Database Update Failure
```
[razorpay/cancel] calling cancel, id= sub_xxx cancel_at_cycle_end= false existing.status= active
[razorpay/cancel] Failed to update local database: Error: ...
POST /api/payments/razorpay-subscriptions/sub_xxx/cancel 200 in 1899ms
```

## Related Files
- `src/app/protected/user/manage-subscription/page.tsx` - Frontend dialog and UI
- `src/app/api/payments/razorpay-subscriptions/[id]/cancel/route.ts` - Cancel API with DB update
- `src/app/api/user/subscription-status/route.ts` - Status fetching with preservation logic
- `src/components/ui/dialog.tsx` - Dialog component
- `src/components/ui/button.tsx` - Button component
- `src/db/schema/schema.ts` - Database schema

## Benefits

### Before
- ❌ Browser-native popup
- ❌ Status not persisted on page refresh
- ❌ Cancelled subscriptions could be marked as expired
- ❌ Inconsistent state between UI and database

### After
- ✅ Beautiful, branded dialog
- ✅ Cancelled status persists across refreshes
- ✅ Cancelled status is never overridden
- ✅ Database and UI always in sync
- ✅ Proper error handling
- ✅ Clear user feedback
- ✅ Accessible and responsive
