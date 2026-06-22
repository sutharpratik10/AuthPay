# Subscription Plan Visibility Feature

## Overview
This feature allows admins to control which subscription plans are visible to customers on the pricing page, enabling phasing out old plans without affecting existing subscribers.

## Key Features

### 1. Database Schema Update
- **New Column**: `is_visible_to_customers` in `subscription_plans` table
  - Type: `boolean`
  - Default: `true`
  - Purpose: Controls visibility on pricing page

### 2. API Endpoints

#### Public Endpoint
- **GET `/api/subscription-plans/visible`**
  - Fetches only visible plans from Razorpay
  - Filters based on `isVisibleToCustomers` flag
  - No authentication required (for pricing page)
  - Returns: Array of visible plans with Razorpay data

#### Admin Endpoints
- **GET `/api/admin/subscription-plans/all`**
  - Fetches all plans (visible and hidden) with metadata
  - Requires admin authentication
  - Returns: All plans + summary statistics
  
- **PATCH `/api/admin/subscription-plans/[id]/visibility`**
  - Toggles plan visibility for customers
  - Requires admin authentication
  - Body: `{ isVisibleToCustomers: boolean }`
  - Returns: Updated plan + success message

### 3. Admin Management Interface

**Location**: `/protected/admin/subscription-plans`

**Features**:
- View all Razorpay plans with visibility status
- Toggle visibility with a switch
- Summary cards showing:
  - Total plans
  - Visible plans
  - Hidden plans
  - Configured plans (in database)
- Real-time updates
- Informational tooltips

**Component**: `AdminSubscriptionPlansManager.tsx`

### 4. Customer Pricing Page

**Location**: `/pricing`

**Changes**:
- Now fetches plans dynamically from `/api/subscription-plans/visible`
- Only displays plans marked as visible
- Supports monthly/yearly billing toggle
- Shows Razorpay pricing data
- Displays plan features from database

**Component**: `PricingPage.tsx`

## How It Works

### Phase-Out Workflow

1. **Admin marks plan as hidden**:
   ```
   Admin Panel → Subscription Plans → Toggle visibility OFF
   ```

2. **Plan disappears from pricing page**:
   - Customers cannot see or purchase the plan
   - Existing subscribers are NOT affected
   - Plan continues to function normally

3. **Existing subscribers continue**:
   - Active subscriptions remain active
   - Renewals work as expected
   - No interruption to service

### Integration with Razorpay

1. **Plans are created in Razorpay**
2. **Plans are synced to database** (with `razorpaySubscriptionPlanId`)
3. **Admin controls visibility** via admin panel
4. **Customers see only visible plans** on pricing page

## Database Migration

**Migration File**: `0010_military_magneto.sql`

```sql
ALTER TABLE "subscription_plans" 
ADD COLUMN "is_visible_to_customers" boolean DEFAULT true NOT NULL;
```

**Applied**: Yes ✅

## Configuration Requirements

### Environment Variables
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay secret key

### Database Schema
Plans must have:
- `razorpaySubscriptionPlanId` - Link to Razorpay plan
- `isActive` - General active status
- `isVisibleToCustomers` - Visibility control (NEW)
- `features` - JSON array of features to display

## Usage Instructions

### For Admins

#### Hiding a Plan (Phasing Out)
1. Navigate to `/protected/admin/subscription-plans`
2. Find the plan to hide
3. Toggle the visibility switch to OFF
4. Plan immediately becomes hidden from customers
5. Existing subscriptions continue unaffected

#### Making a Plan Visible
1. Navigate to `/protected/admin/subscription-plans`
2. Find the hidden plan
3. Toggle the visibility switch to ON
4. Plan immediately appears on pricing page

### For Customers

- Visit `/pricing` to see available plans
- Only visible plans are displayed
- Can toggle between monthly/yearly billing
- Click "Start Growing Now" to purchase

## Technical Implementation

### Data Flow

```
Razorpay Plans
      ↓
GET /api/subscription-plans/visible
      ↓
Filter by isVisibleToCustomers = true
      ↓
Pricing Page Component
      ↓
Display to Customers
```

### Admin Flow

```
Admin Panel
      ↓
Toggle Visibility Switch
      ↓
PATCH /api/admin/subscription-plans/[id]/visibility
      ↓
Update Database
      ↓
Refresh Admin View
```

## Benefits

1. **No Customer Impact**: Hiding plans doesn't affect existing subscriptions
2. **Gradual Phase-Out**: Remove plans from new sales while supporting existing customers
3. **Flexible Pricing**: Test new pricing without deleting old plans
4. **Clean Pricing Page**: Show only relevant plans to customers
5. **Audit Trail**: Plans remain in database for reference

## Security

- **Admin-only control**: Only admins can toggle visibility
- **RBAC protected**: Uses `requireAdmin: true` middleware
- **Public read**: Pricing page accessible to all (shows visible plans only)
- **No deletion required**: Plans never deleted, only hidden

## Future Enhancements

1. **Schedule visibility changes** (e.g., hide plan on specific date)
2. **Bulk visibility operations**
3. **Plan deprecation warnings** for existing subscribers
4. **Migration paths** to move users to new plans
5. **Visibility analytics** (views, conversions by plan)

## Testing

### Test Scenarios

1. **Admin can see all plans**:
   - Visit `/protected/admin/subscription-plans`
   - Should see all Razorpay plans

2. **Toggle visibility works**:
   - Toggle a plan to hidden
   - Check pricing page - plan should disappear
   - Toggle back to visible
   - Check pricing page - plan should reappear

3. **Customers see only visible plans**:
   - Visit `/pricing`
   - Should see only plans with `isVisibleToCustomers = true`

4. **Existing subscriptions unaffected**:
   - Hide a plan
   - User with existing subscription should still have access
   - Renewal should work normally

## Troubleshooting

### Plan not appearing on pricing page

**Possible causes**:
1. Plan not marked as visible (`isVisibleToCustomers = false`)
2. Plan not active in Razorpay
3. Plan not synced to database yet
4. Database entry missing `razorpaySubscriptionPlanId`

**Solution**:
- Check admin panel visibility status
- Verify plan exists in Razorpay
- Ensure plan is synced to database with correct Razorpay ID

### Cannot toggle visibility

**Possible causes**:
1. Plan not yet configured in database (`hasDbEntry = false`)
2. Missing `dbPlanId`
3. Permission denied (not admin)

**Solution**:
- Create plan in database first
- Link with `razorpaySubscriptionPlanId`
- Verify admin permissions

## Files Modified/Created

### New Files
- `src/app/api/subscription-plans/visible/route.ts`
- `src/app/api/admin/subscription-plans/all/route.ts`
- `src/app/api/admin/subscription-plans/[id]/visibility/route.ts`
- `src/components/admin/AdminSubscriptionPlansManager.tsx`
- `src/app/protected/admin/subscription-plans/page.tsx`
- `docs/SUBSCRIPTION-VISIBILITY-FEATURE.md` (this file)

### Modified Files
- `src/server/db/schema/schema.ts` (added `isVisibleToCustomers` column)
- `src/components/user/PricingPage.tsx` (fetch from API instead of hardcoded)
- `src/components/layout/sidebarmenu.tsx` (added admin menu item)

### Migration Files
- `src/server/db/migrations/0010_military_magneto.sql`

## Summary

This feature provides a complete solution for managing subscription plan visibility, allowing admins to phase out old plans gracefully without disrupting existing customers. The implementation follows best practices for RBAC, API design, and user experience.
