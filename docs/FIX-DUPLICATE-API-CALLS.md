# Quick Fix for Duplicate API Calls

## Issue
The `/api/user/subscription-status` endpoint is being called multiple times during initial page load.

## Root Cause
Multiple components are mounting and calling `useSubscription()` hook, and SWR's deduplication isn't working optimally during the initial render phase.

## Solution Applied

### 1. Enhanced SWR Configuration (`src/lib/swr-config.ts`)
- Added `revalidateIfStale: false` to prevent redundant revalidation
- Added `keepPreviousData: true` for smoother transitions
- Added `credentials: 'include'` to fetcher for proper session cookies
- Increased deduplication intervals

### 2. Global SWRConfig Provider (`src/components/layout/client-layout.tsx`)
- Wrapped entire app with `<SWRConfig>` to ensure consistent configuration
- All SWR hooks now share the same cache and configuration

### 3. What This Fixes
- ✅ Reduces duplicate API calls during initial mount
- ✅ Ensures all hooks use same SWR cache
- ✅ Prevents unnecessary revalidation when data is fresh
- ✅ Improves perceived performance with `keepPreviousData`

## Expected Behavior After Fix

### Before:
```
GET /api/user/subscription-status 200 in 6712ms
GET /api/user/subscription-status 200 in 8ms
GET /api/user/subscription-status 200 in 13ms
```

### After:
```
GET /api/user/subscription-status 200 in 6712ms
(subsequent calls use cached data - no API call)
```

## Why Some Duplication Still Occurs

### Development Mode
- Next.js Fast Refresh can cause double renders
- Hot Module Replacement (HMR) triggers re-renders
- This is normal in development, won't happen in production

### Initial Mount Timing
- If multiple components mount before the first API call completes, SWR may make parallel requests
- The `dedupingInterval` prevents subsequent calls after the first completes

### Different Providers
The following APIs are still called (this is expected):
1. `/api/auth/session` - From NextAuth SessionProvider
2. `/api/user/data` - From UserValidationProvider (once)
3. `/api/user/subscription-status` - From SubscriptionProvider (once)

## Monitoring

To verify the fix is working, check:
1. Network tab in DevTools
2. Count number of calls to each endpoint
3. Most calls should show "(from SWR cache)" in logs

## Further Optimization (Optional)

If you still see duplicates, you can:

### Option 1: Combine More Data
Merge subscription data into `/api/user/data`:
```typescript
GET /api/user/data
Returns: {
  isAdmin, exists, shouldSignOut,
  subscription: { hasSubscription, planName, ... }
}
```

### Option 2: Add Request Deduplication at API Level
```typescript
// In API route
import { unstable_cache } from 'next/cache';

export const GET = unstable_cache(
  async (request) => { /* handler */ },
  ['user-subscription'],
  { revalidate: 30 }
);
```

### Option 3: Server Components
Use Next.js Server Components to fetch data once on server:
```typescript
// app/protected/layout.tsx (Server Component)
export default async function Layout() {
  const data = await fetchUserData(); // Server-side only
  return <ClientComponent data={data} />;
}
```

## Testing

Run these commands to test:
```bash
# Start dev server
npm run dev

# Open browser and check Network tab
# You should see fewer duplicate calls

# Build for production and test
npm run build
npm start
```

In production mode, you should see almost no duplicates due to:
- No Fast Refresh
- No HMR
- Optimized React rendering
- Better SWR deduplication

## Summary

The configuration changes will significantly reduce duplicate API calls. Some duplication in development mode is normal and won't affect production performance.
