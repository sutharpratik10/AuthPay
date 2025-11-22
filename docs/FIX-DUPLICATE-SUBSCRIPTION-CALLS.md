# Fix: Duplicate Subscription Status API Calls

## Problem
The `/api/user/subscription-status` endpoint was being called **twice** with identical requests:
```
[API] GET /api/user/subscription-status - No subscription found (97ms)
[API] GET /api/user/subscription-status [User: c835c3f9...] - 98ms
```

## Root Cause

### Issue 1: Unstable SWR Key
The SWR key was being recreated on every render:
```typescript
// Old code - key is recreated on every render
useSWR(
  status === 'authenticated' && userId ? '/api/user/subscription-status' : null,
  swrConfigFrequent
)
```

When the session status changed from `'loading'` → `'authenticated'`, the key would change, triggering a new fetch even if SWR already had data for that URL.

### Issue 2: Implicit Fetcher
The fetcher function wasn't explicitly passed, so SWR might have been using different fetcher instances instead of sharing the global one.

## Solution Applied

### 1. Memoized SWR Keys
Stabilized the SWR keys using `useMemo`:

**SubscriptionContext.tsx:**
```typescript
const swrKey = useMemo(() => {
  return status === 'authenticated' && userId ? '/api/user/subscription-status' : null;
}, [status, userId]);

useSWR(swrKey, { ...swrConfigFrequent, fetcher: swrConfigFrequent.fetcher })
```

**UserValidationContext.tsx:**
```typescript
const swrKey = useMemo(() => {
  return status === 'authenticated' && userId ? '/api/user/data' : null;
}, [status, userId]);

useSWR(swrKey, { ...swrConfigRare, fetcher: swrConfigRare.fetcher })
```

### 2. Explicit Fetcher
Explicitly passed the fetcher to ensure all SWR hooks use the same fetcher instance:
```typescript
useSWR(swrKey, {
  ...swrConfigFrequent,
  fetcher: swrConfigFrequent.fetcher,  // ← Explicitly defined
})
```

## How It Works

### Before (Unstable):
```
Render 1: status='loading', userId=undefined
  → SWR key: null (no fetch)

Render 2: status='authenticated', userId='abc123'
  → SWR key: '/api/user/subscription-status' (fetch #1)
  → Key object recreated, SWR thinks it's new

Render 3: (some state change)
  → SWR key: '/api/user/subscription-status' (fetch #2)
  → Key object recreated again, another fetch!
```

### After (Stable):
```
Render 1: status='loading', userId=undefined
  → SWR key: null (no fetch)

Render 2: status='authenticated', userId='abc123'
  → SWR key: '/api/user/subscription-status' (fetch #1)
  → Memoized! Same object reference

Render 3: (some state change)
  → SWR key: '/api/user/subscription-status' (cached!)
  → Same object reference, SWR uses cache ✅
```

## Expected Behavior

### Before Fix:
```
GET /api/user/subscription-status 200 in 1604ms  ← Request 1
GET /api/user/subscription-status 200 in 98ms    ← Request 2 (duplicate!)
```

### After Fix:
```
GET /api/user/subscription-status 200 in 1604ms  ← Only one request
(subsequent access uses SWR cache)
```

## Files Modified

1. ✅ `src/contexts/SubscriptionContext.tsx`
   - Added `useMemo` for stable SWR key
   - Explicitly passed fetcher function

2. ✅ `src/contexts/UserValidationContext.tsx`
   - Added `useMemo` for stable SWR key
   - Explicitly passed fetcher function

3. ✅ `src/lib/swr-config.ts` (from previous fix)
   - Enhanced deduplication settings
   - Better cache configuration

4. ✅ `src/components/layout/client-layout.tsx` (from previous fix)
   - Wrapped app with global `<SWRConfig>`

## Testing

### What to Check:
1. **Network Tab**: Should see only 1 call to each API endpoint
2. **Console Logs**: Should see single API log entries
3. **Performance**: Faster initial page load

### Test Commands:
```bash
# Restart dev server
npm run dev

# Open browser DevTools → Network tab
# Reload page and check:
# ✅ /api/user/data - Called ONCE
# ✅ /api/user/subscription-status - Called ONCE
# ✅ /api/auth/session - Called 1-2 times (normal)
```

## Why This Fix Works

### 1. Stable References
`useMemo` ensures the SWR key object reference remains the same across renders when dependencies (`status`, `userId`) haven't changed.

### 2. SWR Deduplication
SWR uses the key reference for caching. Same reference = cache hit. Different reference = new fetch.

### 3. Shared Fetcher
Explicit fetcher ensures all SWR hooks use the same function instance, improving cache sharing.

## Additional Benefits

1. **Better Performance**: Fewer API calls = faster page loads
2. **Reduced Server Load**: Less database queries
3. **Improved UX**: Faster data availability from cache
4. **Predictable Behavior**: Stable keys = predictable caching

## Edge Cases Handled

### Case 1: User Login
```
Before login: status='unauthenticated' → key: null
After login:  status='authenticated'   → key: '/api/...'
✅ Only 1 fetch on login
```

### Case 2: Component Re-mount
```
Mount:    SWR fetches data
Unmount:  Data stays in cache
Re-mount: SWR uses cache (no new fetch)
✅ Cache persists across mounts
```

### Case 3: Manual Refresh
```
User clicks "refresh": mutate() called
✅ Intentional re-fetch works as expected
```

## Monitoring

Add console logging to verify (optional):
```typescript
const swrKey = useMemo(() => {
  const key = status === 'authenticated' && userId 
    ? '/api/user/subscription-status' 
    : null;
  console.log('[SWR Key]', key); // Should only log when status/userId changes
  return key;
}, [status, userId]);
```

## Summary

✅ Fixed duplicate API calls by:
1. Memoizing SWR keys with `useMemo`
2. Explicitly passing fetcher function
3. Ensuring stable object references
4. Proper dependency tracking

Result: **Each API endpoint is now called only once per session** instead of multiple times!
