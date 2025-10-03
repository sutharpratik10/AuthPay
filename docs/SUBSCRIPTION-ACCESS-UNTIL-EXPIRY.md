# Subscription Cancellation - Access Until Expiry

## Overview
When users cancel their subscription, they maintain full access to premium features until the end of their current billing period (expiry date). This provides a better user experience and aligns with industry standards.

## Problem
**Original Behavior:**
- User cancels subscription
- Access is removed immediately
- User loses paid features even though they paid for the full billing period

**Industry Standard:**
- User cancels subscription
- User retains access until billing period ends
- Access is removed only after expiry date is reached

## Solution Implemented

### 1. Cancel Route - Preserve Expiry Date
**File**: `src/app/api/payments/razorpay-subscriptions/[id]/cancel/route.ts`

**Key Changes:**
- Status is set to 'cancelled' immediately
- `endDate` is **NOT** set immediately
- Original `expiryDate` is preserved
- User retains access until `expiryDate` is reached

```typescript
// Update the user's subscription to cancelled status
// NOTE: We keep the original expiryDate so user has access until billing period ends
// endDate is NOT set immediately - it will be set when expiryDate is reached
await db.update(userSubscriptions)
  .set({ 
    statusId: cancelledStatus.id,
    // Don't set endDate yet - user keeps access until expiryDate
    updatedAt: new Date().toISOString()
  })
  .where(and(
    eq(userSubscriptions.userId, session.user.id),
    eq(userSubscriptions.razorpaySubscriptionId, id)
  ));

console.log('[razorpay/cancel] Updated local database for user:', session.user.id, 'Access until:', currentSub?.expiryDate);
```

### 2. Status Check - Access Based on Expiry
**File**: `src/app/api/user/subscription-status/route.ts`

**Key Changes:**
- `isActive` is now based on expiry date, not status
- Cancelled subscriptions with future expiry dates have `isActive = true`
- Cancelled subscriptions past expiry date have `isActive = false`

```typescript
// Determine access status based on expiry date and subscription status
if (expiry && expiry <= now) {
  // Subscription has expired
  if (status === 'cancelled') {
    status = 'cancelled'; // Keep cancelled status even after expiry
  } else {
    status = 'expired';
  }
  isActive = false;
} else if (status === 'active') {
  isActive = true;
} else if (status === 'cancelled') {
  // Cancelled but not yet expired - user still has access
  if (expiry && expiry > now) {
    isActive = true; // User retains access until expiry date
  } else {
    isActive = false;
  }
  status = 'cancelled';
}
```

### 3. Frontend - Clear Communication
**File**: `src/app/protected/user/manage-subscription/page.tsx`

#### Status Badge Enhancement
- Cancelled subscriptions now show in **orange** (not red)
- Helper text displays: "You have access until [date]"
- Makes it clear the user still has active access

```tsx
{subscriptionStatus.status === 'cancelled' && subscriptionStatus.expiryDate && new Date(subscriptionStatus.expiryDate) > new Date() && (
  <p className="text-xs text-muted-foreground mt-1">
    You have access until {formatDate(subscriptionStatus.expiryDate)}
  </p>
)}
```

#### Next Billing Card
- Label changes from "Next Billing" to **"Access Until"** for cancelled subscriptions
- Shows expiry date in orange to draw attention
- Clear visual indicator of when access ends

```tsx
<p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
  {subscriptionStatus.status === 'cancelled' 
    ? 'Access Until' 
    : subscriptionStatus.status === 'lifetime' 
    ? 'Valid Until' 
    : 'Next Billing'}
</p>
```

#### Cancel Dialog Enhancement
- Dialog color changed from red to orange (less alarming)
- Message clarifies: "you'll continue to have access until the end of your current billing period"
- Shows exact expiry date in dialog
- Sets proper expectations before cancellation

```tsx
<DialogDescription className="pt-3 space-y-2">
  <p>
    Are you sure you want to cancel your subscription? Your subscription will not renew, 
    but you&apos;ll continue to have access to premium features until the end of your current billing period.
  </p>
  {subscriptionStatus?.expiryDate && (
    <p className="font-semibold text-foreground">
      Access until: {formatDate(subscriptionStatus.expiryDate)}
    </p>
  )}
</DialogDescription>
```

## User Experience Flow

### Scenario 1: Active Subscription (Before Cancellation)
```
Status: active (green badge)
isActive: true
Access: ✅ Full access
Next Billing: September 27, 2026
Button: "Cancel subscription" (red)
```

### Scenario 2: Cancelled Subscription (Still in Billing Period)
```
Status: cancelled (orange badge)
Helper Text: "You have access until September 27, 2026"
isActive: true ✅
Access: ✅ Full access (unchanged)
Access Until: September 27, 2026 (orange text)
Button: "cancelled" badge (gray, no action)
```

### Scenario 3: Cancelled Subscription (After Expiry)
```
Status: cancelled (orange badge)
isActive: false ❌
Access: ❌ No access
Access Until: September 27, 2026 (past date)
Features: Locked
```

## Access Control Logic

### How to Check User Access in Your App

```typescript
// Example: Check if user has active subscription access
const hasAccess = subscriptionData.isActive;

if (hasAccess) {
  // User can access premium features
  // This is true for:
  // - active subscriptions
  // - trialing subscriptions
  // - cancelled subscriptions that haven't expired yet
} else {
  // User cannot access premium features
  // This is true for:
  // - expired subscriptions
  // - cancelled subscriptions past expiry date
  // - no subscription
}
```

### Status vs Access Matrix

| Status | Expiry Date | isActive | User Access | UI Display |
|--------|-------------|----------|-------------|------------|
| active | Future | ✅ true | ✅ Full | Green badge, "Next Billing: [date]" |
| trialing | Future | ✅ true | ✅ Full | Yellow badge, "Next Billing: [date]" |
| cancelled | Future | ✅ true | ✅ Full | Orange badge, "Access Until: [date]" |
| cancelled | Past | ❌ false | ❌ None | Orange badge, No access message |
| expired | Past | ❌ false | ❌ None | Red badge, "Expired" |

## Database Schema

### Fields and Their Purpose

```typescript
userSubscriptions {
  statusId: UUID           // 'active', 'cancelled', 'expired', etc.
  expiryDate: timestamp    // When current billing period ends
  endDate: timestamp       // When subscription actually ended (only set after expiry)
  
  // For cancelled subscriptions:
  // - statusId = 'cancelled' (immediate)
  // - expiryDate = original date (preserved)
  // - endDate = null (will be set when expiry is reached)
}
```

## Automated Expiry Handling

When automated jobs or page loads check for expired subscriptions:

```typescript
// This logic runs in GET and POST /api/user/subscription-status
// It updates expired subscriptions but EXCLUDES cancelled ones

const [expiredStatus, cancelledStatus] = await Promise.all([...]);

await db.update(userSubscriptions)
  .set({ statusId: expiredStatus.id, endDate: new Date().toISOString() })
  .where(and(
    eq(userSubscriptions.userId, userId),
    lt(userSubscriptions.expiryDate, new Date().toISOString()),
    ne(userSubscriptions.statusId, expiredStatus.id),
    cancelledStatus?.id ? ne(userSubscriptions.statusId, cancelledStatus.id) : undefined
  ));
```

**Key Point:** Cancelled subscriptions are excluded from this update, so their status remains 'cancelled' even after expiry.

## Benefits

### User Benefits
- ✅ Fair treatment - get what they paid for
- ✅ Clear communication - know exactly when access ends
- ✅ No surprises - access doesn't disappear immediately
- ✅ Time to reconsider - can reactivate before expiry
- ✅ Industry standard - matches expectations from other services

### Business Benefits
- ✅ Better user experience = higher satisfaction
- ✅ Reduced support requests about "lost access"
- ✅ More time for win-back campaigns
- ✅ Professional cancellation flow
- ✅ Aligns with payment provider best practices

### Technical Benefits
- ✅ Clear separation of concerns (status vs access)
- ✅ `isActive` field accurately represents access
- ✅ Audit trail preserved (statusId change + expiry date)
- ✅ Flexible - easy to add grace periods later
- ✅ Testable - clear logic for access determination

## Visual Changes

### Status Badge Colors
- **Green**: Active subscription (will renew)
- **Yellow**: Trial subscription
- **Orange**: Cancelled subscription (access until expiry)
- **Red**: Expired subscription (no access)

### Dialog Color
- Changed from **red** (alarming) to **orange** (warning)
- Indicates caution but not immediate loss

## Testing Scenarios

### Test 1: Cancel During Billing Period
1. Subscribe to a plan (expiry: 1 month from now)
2. Cancel subscription immediately
3. ✅ Status shows "cancelled" (orange)
4. ✅ Access Until shows expiry date
5. ✅ User can still access premium features
6. ✅ Database: statusId=cancelled, expiryDate=unchanged, endDate=null

### Test 2: Access After Cancellation
1. Using cancelled subscription from Test 1
2. Try to access premium features
3. ✅ Features are accessible
4. ✅ isActive = true in API response

### Test 3: Expiry After Cancellation
1. Wait for expiry date to pass (or manually set expiryDate to past)
2. Load subscription page
3. ✅ Status still shows "cancelled" (not "expired")
4. ✅ isActive = false
5. ✅ Premium features are locked
6. ✅ UI shows access has ended

### Test 4: Page Refresh Persistence
1. Cancel subscription
2. Refresh page multiple times
3. ✅ Status remains "cancelled"
4. ✅ Access remains active (if before expiry)
5. ✅ Expiry date unchanged

### Test 5: Expired Subscription Batch Update
1. Cancel subscription
2. Trigger POST /api/user/subscription-status (batch update)
3. ✅ Cancelled subscription is NOT changed to expired
4. ✅ Other expired subscriptions ARE updated
5. ✅ Cancelled subscription status preserved

## API Response Examples

### Active Subscription
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "status": "active",
    "isActive": true,
    "expiryDate": "2026-09-27T00:00:00.000Z",
    "planName": "Pro",
    "price": "₹3,599.99"
  }
}
```

### Cancelled (Before Expiry)
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "status": "cancelled",
    "isActive": true,  // Still has access!
    "expiryDate": "2026-09-27T00:00:00.000Z",
    "planName": "Pro",
    "price": "₹3,599.99"
  }
}
```

### Cancelled (After Expiry)
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "status": "cancelled",
    "isActive": false,  // Access removed
    "expiryDate": "2025-09-27T00:00:00.000Z",
    "planName": "Pro",
    "price": "₹3,599.99"
  }
}
```

## Files Modified

1. **`src/app/api/payments/razorpay-subscriptions/[id]/cancel/route.ts`**
   - Don't set endDate immediately
   - Preserve expiryDate
   - Log access until date

2. **`src/app/api/user/subscription-status/route.ts`**
   - Set isActive based on expiry date for cancelled subscriptions
   - Cancelled + future expiry = isActive true
   - Cancelled + past expiry = isActive false

3. **`src/app/protected/user/manage-subscription/page.tsx`**
   - Orange badge for cancelled (not red)
   - Helper text: "You have access until [date]"
   - "Access Until" label for cancelled subscriptions
   - Updated dialog message and color
   - Show expiry date in dialog

## Migration Notes

If you have existing cancelled subscriptions in your database:

```sql
-- Check cancelled subscriptions
SELECT id, user_id, status_id, expiry_date, end_date
FROM user_subscriptions
WHERE status_id = (SELECT id FROM subscription_statuses WHERE name = 'cancelled');

-- If endDate was set to past dates, you may want to:
-- 1. Keep them as-is (access already removed)
-- 2. Or update endDate to null if expiry is future
UPDATE user_subscriptions
SET end_date = NULL, updated_at = NOW()
WHERE status_id = (SELECT id FROM subscription_statuses WHERE name = 'cancelled')
  AND expiry_date > NOW();
```

## Completion Checklist

- [x] Cancel route preserves expiryDate
- [x] Cancel route doesn't set endDate immediately
- [x] Status API checks expiry for cancelled subscriptions
- [x] isActive = true when cancelled but before expiry
- [x] isActive = false when cancelled and after expiry
- [x] Frontend shows orange badge for cancelled
- [x] Frontend shows "Access Until" for cancelled
- [x] Frontend shows helper text with expiry date
- [x] Dialog message updated for clarity
- [x] Dialog shows expiry date
- [x] Plan name shows for cancelled subscriptions
- [x] Cancelled status preserved (not overridden by expired)
- [x] No TypeScript errors
- [x] Documentation complete
