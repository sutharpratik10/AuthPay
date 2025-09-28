# Razorpay Subscription Plans Integration

This document explains how to use the Razorpay subscription plans integration that automatically syncs plans between Razorpay and your local database.

## Overview

The integration provides:
- ✅ **Automatic sync** of Razorpay subscription plans with local database
- ✅ **Upsert logic** - creates new plans or updates existing ones by `razorpaySubscriptionPlanId`
- ✅ **Admin dashboard** for managing plans and monitoring sync status
- ✅ **User-facing components** for displaying and purchasing plans
- ✅ **API endpoints** for programmatic access
- ✅ **Type-safe** implementation with TypeScript

## Database Schema

The `subscription_plans` table includes these Razorpay-specific fields:
```sql
-- Razorpay integration fields (all nullable)
razorpay_subscription_id VARCHAR(100),
razorpay_subscription_plan_id VARCHAR(100),
razorpay_subscription_link VARCHAR(255)
```

## Components

### 1. Admin Components

#### `AdminSubscriptionPlans`
Admin interface for managing subscription plans:
- View all plans with status indicators
- Sync with Razorpay (one-click sync)
- Activate/deactivate plans
- View sync results and error logs
- Direct links to Razorpay dashboard

```tsx
import AdminSubscriptionPlans from '@/components/admin/AdminSubscriptionPlans';

export default function AdminPage() {
  return <AdminSubscriptionPlans />;
}
```

#### Admin Page
Access at: `/protected/admin/subscription-plans`

### 2. User Components

#### `SubscriptionPlansSelector` (Enhanced)
User-facing plan selector with Razorpay integration:
- Displays active, purchasable plans
- Monthly/yearly billing toggle
- Direct Razorpay checkout integration
- Responsive design with plan comparison

```tsx
import SubscriptionPlansSelector from '@/components/SubscriptionPlansSelector';

export default function PricingPage() {
  return (
    <SubscriptionPlansSelector 
      onPlanSelected={(planId) => console.log('Selected:', planId)}
      showTitle={true}
    />
  );
}
```

## API Endpoints

### Admin Endpoints (Protected)

#### Get All Plans
```
GET /api/admin/subscription-plans
```
Returns all subscription plans with enhanced metadata.

#### Create/Update Plan
```
POST /api/admin/subscription-plans
PUT /api/admin/subscription-plans
```
Create or update subscription plans programmatically.

#### Sync with Razorpay
```
POST /api/admin/subscription-plans/sync
```
Triggers sync with Razorpay. Returns detailed sync results.

### Public Endpoints

#### Get Active Plans
```
GET /api/subscription-plans
```
Returns only active, purchasable plans for users.

#### Get Plan by ID
```
GET /api/subscription-plans/[id]
```
Get specific plan details.

## Service Layer

### `SubscriptionPlanService`

The main service class provides:

```typescript
import { subscriptionPlanService } from '@/services/subscription-plans';

// Fetch plans from Razorpay
const razorpayPlans = await subscriptionPlanService.fetchRazorpayPlans();

// Sync with database (upsert logic)
const syncResult = await subscriptionPlanService.syncRazorpayPlans();

// Get active plans for users
const userPlans = await subscriptionPlanService.getActiveSubscriptionPlans();

// Get plan by ID
const plan = await subscriptionPlanService.getSubscriptionPlanById('plan-id');

// Create/update plan manually
const plan = await subscriptionPlanService.upsertSubscriptionPlan({
  name: 'Pro Plan',
  price: 'INR 999.00',
  billingCycle: 'monthly',
  razorpaySubscriptionPlanId: 'plan_xyz'
});
```

## Setup Instructions

### 1. Environment Variables
Ensure these are set in your `.env` file:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### 2. Database Migration
The schema is already included in your existing `subscription_plans` table. Run migrations if needed:
```bash
npm run db:generate
npm run db:push
```

### 3. Test the Integration
Run the test script to verify everything works:
```bash
npm run razorpay:sync
```

This will:
- ✅ Test Razorpay API connection
- ✅ Fetch plans from Razorpay
- ✅ Sync with local database
- ✅ Show detailed results

## Usage Workflow

### For Admins:

1. **Initial Setup**: Create subscription plans in your Razorpay dashboard
2. **Sync**: Use the admin panel or API to sync plans to your database
3. **Manage**: Use the admin interface to activate/deactivate plans
4. **Monitor**: Check sync results and handle any errors

### For Users:

1. **Browse**: Users see active, purchasable plans
2. **Compare**: Toggle between monthly/yearly billing
3. **Purchase**: Direct integration with Razorpay checkout
4. **Activate**: Plans are automatically activated post-payment

## Sync Logic (Upsert)

The sync process:

1. **Fetch** all plans from Razorpay
2. **Check** if plan exists by `razorpaySubscriptionPlanId`
3. **Update** existing plans with latest Razorpay data
4. **Create** new plans that don't exist locally
5. **Return** detailed results (created/updated counts, errors)

### Plan Matching
Plans are matched using `razorpaySubscriptionPlanId` to avoid duplicates.

### Data Mapping
```
Razorpay Plan → Local Plan
├── plan.id → razorpaySubscriptionPlanId
├── plan.item.name → name
├── plan.item.description → description
├── plan.item.amount → price (converted from paisa)
├── plan.period → billingCycle
├── plan.item.active → isActive
└── plan.notes → features (JSON)
```

## Types

Key TypeScript interfaces:

```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: string;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  razorpaySubscriptionId: string | null;
  razorpaySubscriptionPlanId: string | null;
  razorpaySubscriptionLink: string | null;
  priceNumber: number;
  formattedPrice: string;
  canPurchase: boolean; // true if has razorpaySubscriptionPlanId
}

interface SyncResult {
  synced: number;
  updated: number;
  created: number;
  errors: string[];
}
```

## Error Handling

The integration includes comprehensive error handling:

- **API Errors**: Graceful handling of Razorpay API failures
- **Validation**: Input validation for plan data
- **Sync Errors**: Individual plan sync errors don't stop the entire process
- **User Feedback**: Toast notifications for all operations
- **Logging**: Detailed console logging for debugging

## Security

- **Admin-only**: Sync operations require admin permissions
- **API Protection**: Admin endpoints use permission middleware
- **Input Sanitization**: All inputs are validated and sanitized
- **Environment Variables**: Sensitive keys stored in environment

## Troubleshooting

### Common Issues:

1. **Razorpay API Connection Failed**
   - Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
   - Verify network connectivity
   - Check Razorpay dashboard for API status

2. **Plans Not Syncing**
   - Ensure plans exist in Razorpay dashboard
   - Check for API rate limits
   - Review error logs in admin panel

3. **Purchase Flow Issues**
   - Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
   - Check Razorpay webhook configuration
   - Ensure plans have `razorpaySubscriptionPlanId`

### Debug Commands:

```bash
# Test Razorpay connection
npm run razorpay:sync

# Check database
npm run db:studio

# View logs
# Check browser console and server logs
```

## Next Steps

Consider implementing:
- **Webhooks**: Real-time sync when plans change in Razorpay
- **Plan Categories**: Group plans by features/tiers
- **Usage Analytics**: Track plan performance
- **Automated Tests**: Unit and integration tests
- **Caching**: Redis caching for frequently accessed plans

---

🎉 **Your Razorpay subscription plans integration is now complete and ready to use!**
