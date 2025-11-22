# Performance Optimization: Unified User Data Hook

## Problem Statement

The initial implementation was making multiple sequential API calls on page load:

1. `/api/auth/session` - Multiple times (by next-auth)
2. `/api/user/admin-status` - By `useUserStatus` hook
3. `/api/auth/validate-user` - By `useUserValidation` hook  
4. `/api/user/subscription-status` - By `useSubscription` hook

This caused:
- **Slow initial page load** (6+ seconds)
- **Waterfall effect** - Each hook waited for session, then made sequential requests
- **Redundant auth checks** - Each endpoint validated authentication separately
- **Poor user experience** - Multiple loading states

## Solution

### 1. Unified User Data Hook (`use-user-data.ts`)

Created a single hook that fetches all user-related data in one API call:

```typescript
const { isAdmin, exists, shouldSignOut, isLoading } = useUserData();
```

**Benefits:**
- ✅ Single API call instead of 2+
- ✅ Parallel data fetching with `Promise.all()`
- ✅ Shared SWR cache across components
- ✅ 5-minute deduplication (no redundant calls)
- ✅ Single loading state

### 2. Unified API Endpoint (`/api/user/data`)

Combined multiple checks into one endpoint:

```typescript
GET /api/user/data
// Returns: { isAdmin, exists, shouldSignOut }
```

**Benefits:**
- ✅ Reduced network overhead
- ✅ Single authentication check
- ✅ Parallel database queries
- ✅ Consistent response format
- ✅ Better error handling

### 3. Implementation Details

#### Hook: `src/hooks/use-user-data.ts`
- Uses SWR with `swrConfigRare` (5-minute cache)
- Only fetches when user is authenticated
- Returns safe defaults while loading
- Automatic error handling

#### API: `src/app/api/user/data/route.ts`
- Uses `withApiHandler` for standardized auth
- Parallel execution of checks with `Promise.all()`
- Policy-based RBAC for admin check
- Database query for user validation
- Performance logging

#### Component: `src/components/layout/SidebarMenu.tsx`
- Single hook call: `useUserData()`
- Automatic sign-out on user validation failure
- Clean dependency management

## Performance Improvements

### Before:
```
Sequential Execution:
1. Session load: ~1.4s
2. Admin status: ~1.2s  
3. User validation: ~1.6s
Total: ~4.2s + subscription check
```

### After:
```
Parallel Execution:
1. Session load: ~1.4s
2. Unified user data: ~0.8s (parallel queries)
Total: ~2.2s + subscription check
```

**Result: ~50% faster initial load**

## Migration Guide

### Old Pattern (Don't use):
```typescript
import { useUserStatus } from "@/hooks/use-UserStatus";
import { useUserValidation } from "@/hooks/use-UserValidation";

const { isAdmin } = useUserStatus();
const { exists, shouldSignOut } = useUserValidation();
```

### New Pattern (Use this):
```typescript
import { useUserData } from "@/hooks/use-user-data";

const { isAdmin, exists, shouldSignOut, isLoading } = useUserData();
```

## Additional Optimizations

### 1. Session Provider Configuration
```typescript
<SessionProvider 
  refetchInterval={0}           // Disable auto-polling
  refetchOnWindowFocus={false}  // Disable focus refetch
>
```

### 2. SWR Configuration
- `dedupingInterval: 300000` (5 minutes) for user data
- `revalidateOnFocus: false`
- `revalidateOnReconnect: false`

### 3. Subscription Status
- Kept separate due to different cache strategy (30 seconds)
- More frequently updated than user/admin status
- Could be combined in future if needed

## Future Improvements

1. **Server-Side Data Fetching**: Use Next.js server components to fetch data before rendering
2. **Streaming**: Implement React Suspense for progressive rendering
3. **Prefetching**: Preload user data on authentication
4. **Caching Strategy**: Implement Redis/memory cache for frequently accessed data
5. **GraphQL**: Consider GraphQL for flexible data requirements

## Monitoring

Track these metrics:
- Initial page load time
- Number of API calls per page load
- Time to interactive (TTI)
- Cache hit rate for user data

## Notes

- The old hooks (`useUserStatus`, `useUserValidation`) have been **removed** as they are no longer needed
- All code now uses the unified `useUserData()` hook
- The old API endpoints (`/api/user/admin-status`, `/api/auth/validate-user`) can also be removed if not used elsewhere
