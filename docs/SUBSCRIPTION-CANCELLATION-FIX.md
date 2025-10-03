# Subscription Cancellation - Complete Solution

## Summary
Fixed subscription cancellation to properly persist the cancelled status in the database and prevent it from being overridden.

## Problem
When a user cancelled their subscription:
1. ✅ Razorpay API cancelled the subscription successfully
2. ✅ UI showed "cancelled" status immediately
3. ❌ **Database was NOT updated**
4. ❌ On page refresh, subscription showed as "active" again
5. ❌ Expired subscription updates could override cancelled status

## Solution

### 1. Database Update on Cancellation
**File**: `src/app/api/payments/razorpay-subscriptions/[id]/cancel/route.ts`

After successfully cancelling on Razorpay, we now:
- Query the 'cancelled' status ID from `subscription_statuses` table
- Update `user_subscriptions` table with:
  - `statusId` = cancelled status ID
  - `endDate` = current timestamp
  - `updatedAt` = current timestamp
- Log success/failure for debugging

```typescript
// After successful cancellation on Razorpay, update local database
const cancelledStatus = await db.query.subscriptionStatuses.findFirst({
  where: eq(subscriptionStatuses.name, 'cancelled'),
  columns: { id: true }
});

if (cancelledStatus?.id) {
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
}
```

### 2. Preserve Cancelled Status
**File**: `src/app/api/user/subscription-status/route.ts`

Updated two places to prevent cancelled subscriptions from being marked as expired:

#### GET Handler
```typescript
// Don't override cancelled status with expired
if (expiry && expiry <= now && status !== 'cancelled') {
  status = 'expired';
  isActive = false;
}
```

#### GET Handler - Batch Update
```typescript
// Get both expired AND cancelled status IDs
const [expiredStatus, cancelledStatus] = await Promise.all([...]);

// Exclude cancelled subscriptions from expired update
await db.update(userSubscriptions)
  .set({ statusId: expiredStatus.id, ... })
  .where(and(
    eq(userSubscriptions.userId, userId),
    lt(userSubscriptions.expiryDate, new Date().toISOString()),
    ne(userSubscriptions.statusId, expiredStatus.id),
    cancelledStatus?.id ? ne(userSubscriptions.statusId, cancelledStatus.id) : undefined
  ));
```

#### POST Handler
```typescript
// Same logic: exclude cancelled subscriptions from expired updates
const [expiredStatus, cancelledStatus] = await Promise.all([...]);

await db.update(userSubscriptions)
  .set({ statusId: expiredStatus.id, ... })
  .where(and(
    eq(userSubscriptions.userId, userId),
    lt(userSubscriptions.expiryDate, new Date().toISOString()),
    ne(userSubscriptions.statusId, expiredStatus.id),
    cancelledStatus?.id ? ne(userSubscriptions.statusId, cancelledStatus.id) : undefined
  ));
```

## Benefits

### Before
- ❌ Cancelled status not persisted
- ❌ Page refresh reverts to "active"
- ❌ Database and UI out of sync
- ❌ Cancelled subscriptions could be marked as expired

### After
- ✅ Cancelled status persisted in database
- ✅ Page refresh maintains "cancelled" status
- ✅ Database and UI always in sync
- ✅ Cancelled status never overridden by expired
- ✅ Proper audit trail with endDate

## Data Flow

### When User Cancels Subscription
1. User clicks "Cancel subscription" → Dialog opens
2. User confirms → Dialog closes, button shows "Cancelling..."
3. POST `/api/payments/razorpay-subscriptions/[id]/cancel`
   - ✅ Cancel on Razorpay
   - ✅ Update database with cancelled status
   - ✅ Set endDate to now
4. Success response → UI shows cancelled badge
5. POST `/api/user/subscription-status` (refresh status)
6. Toast notification: "Subscription cancelled successfully"

### When Page Loads/Refreshes
1. GET `/api/user/subscription-status`
   - ✅ Fetch subscription from database
   - ✅ Check if expired (skip if cancelled)
   - ✅ Return cancelled status
   - ✅ Update expired subscriptions (skip cancelled ones)
2. UI displays cancelled status correctly
3. Next Billing shows: "Your subscription is cancelled"

### When Cron Job Runs (Expired Subscriptions)
1. POST `/api/user/subscription-status`
   - ✅ Find subscriptions with expiryDate < now
   - ✅ Exclude cancelled subscriptions
   - ✅ Update only non-cancelled to expired
2. Cancelled subscriptions remain cancelled

## UI States

### Active Subscription
- Badge: Green with checkmark "active"
- Button: Red "Cancel subscription" button visible
- Next Billing: Shows date

### Cancelled Subscription
- Badge: Red "cancelled"
- Button: Gray "cancelled" badge (no button)
- Next Billing: "Your subscription is cancelled"

### Expired Subscription
- Badge: Red "expired"
- Button: None
- Next Billing: N/A

## Status Priority
1. **Cancelled** (highest priority, never overridden)
2. **Expired** (only if not cancelled)
3. **Active** (can be changed to cancelled or expired)

## Error Handling

### Database Update Fails After Razorpay Cancellation
- Error logged to console
- Request still returns success (Razorpay succeeded)
- User sees success message
- Next refresh will attempt to sync status

### Razorpay Cancellation Fails
- Database NOT updated (rollback)
- Error returned to user
- User sees error toast
- Subscription remains active

## Testing Scenarios

1. ✅ Cancel active subscription
2. ✅ Refresh page after cancellation
3. ✅ Check database has cancelled status
4. ✅ Run expired subscription update (POST endpoint)
5. ✅ Verify cancelled subscriptions not marked as expired
6. ✅ Check endDate is set
7. ✅ Verify UI shows "Your subscription is cancelled"
8. ✅ Check subscription history shows cancelled

## Files Modified

1. **`src/app/api/payments/razorpay-subscriptions/[id]/cancel/route.ts`**
   - Added database update logic
   - Sets cancelled status and endDate

2. **`src/app/api/user/subscription-status/route.ts`**
   - GET: Preserve cancelled status (don't override with expired)
   - GET: Exclude cancelled from batch expired updates
   - POST: Exclude cancelled from batch expired updates

3. **`src/app/protected/user/manage-subscription/page.tsx`**
   - Already handles cancelled status correctly in UI
   - No changes needed (UI logic was already correct)

## Console Logs

### Successful Cancellation Flow
```
[razorpay/cancel] calling cancel, id= sub_xxx cancel_at_cycle_end= false existing.status= active
[razorpay/cancel] Updated local database for user: uuid-xxx
POST /api/payments/razorpay-subscriptions/sub_xxx/cancel 200 in 1899ms
POST /api/user/subscription-status 200 in 197ms
```

### Page Refresh (Cancelled Subscription)
```
GET /api/user/subscription-status 200 in 457ms
// Returns: { status: 'cancelled', ... }
```

## Completion Checklist

- [x] Cancel route updates database with cancelled status
- [x] Cancel route sets endDate to current time
- [x] GET handler preserves cancelled status
- [x] GET handler excludes cancelled from expired batch update
- [x] POST handler excludes cancelled from expired batch update
- [x] UI displays cancelled status correctly
- [x] UI shows "Your subscription is cancelled" message
- [x] Page refresh maintains cancelled status
- [x] No TypeScript errors
- [x] Documentation updated
