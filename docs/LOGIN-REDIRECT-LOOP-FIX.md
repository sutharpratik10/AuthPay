# Login Redirect Loop Fix

**Date:** October 4, 2025  
**Issue:** Dashboard redirecting to login page even when user is authenticated

## Problem Analysis

### Symptoms
```
GET /api/auth/session 200 in 2555ms  ✅ Session exists
GET /protected/user/dashboard 200 in 1878ms  ✅ Dashboard loads
GET /auth/login 200 in 1396ms  ❌ Redirects to login
```

### Root Cause

The dashboard was using server-side JWT token verification with `getServerToken()`:

```tsx
// ❌ PROBLEMATIC CODE
export default async function UserDashboardPage() {
  const token = await getServerToken()  // Returns null even with valid session
  
  if (!token) {
    redirect("/auth/login")  // Always redirects!
  }
  
  return <UserDashboard />
}
```

**Why it failed:**
1. The `getServerToken()` helper was trying to manually read cookies and pass them to NextAuth's `getToken()`
2. In Next.js 15 Server Components, the cookie reading mechanism wasn't working correctly
3. Even though `/api/auth/session` returned a valid session (200), the JWT token extraction failed
4. This caused `token` to be `null`, triggering the redirect to login

## Solution

Converted both protected pages to **client components** using NextAuth's `useSession()` hook, which is the recommended and most reliable approach for authentication checks in the app directory.

### Files Changed

#### 1. Dashboard Page (`src/app/protected/user/dashboard/page.tsx`)

**Before:**
```tsx
// Server Component with failing JWT check
import { redirect } from "next/navigation"
import { getServerToken } from "@/lib/auth/get-server-token"

export default async function UserDashboardPage() {
  const token = await getServerToken()
  if (!token) {
    redirect("/auth/login")
  }
  return <UserDashboard />
}
```

**After:**
```tsx
"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export default function UserDashboardPage() {
  const { status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/login")
    }
  }, [status])

  if (status === "loading") {
    return <LoadingState />
  }

  if (status !== "authenticated") {
    return null
  }

  return <UserDashboard />
}
```

#### 2. Account Page (`src/app/protected/account/page.tsx`)

**Before:**
```tsx
// Server Component with ProtectedPageWrapper
import { ProtectedPageWrapper } from "@/components/auth/ProtectedPageWrapper"

export default async function AccountPageWrapper() {
  return (
    <ProtectedPageWrapper>
      <AccountPage />
    </ProtectedPageWrapper>
  )
}
```

**After:**
```tsx
"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export default function AccountPageWrapper() {
  const { status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/login")
    }
  }, [status])

  if (status === "loading") {
    return <LoadingState />
  }

  if (status !== "authenticated") {
    return null
  }

  return <AccountPage />
}
```

## Benefits of This Approach

### ✅ Advantages

1. **Reliable Authentication**
   - Uses NextAuth's official `useSession()` hook
   - No manual cookie handling required
   - Works consistently across all browsers

2. **Better User Experience**
   - Shows loading state while checking authentication
   - No flash of login page
   - Smooth transitions

3. **Simpler Code**
   - No complex token extraction logic
   - No server/client component coordination issues
   - Easier to maintain and debug

4. **Middleware Still Active**
   - Middleware continues to protect routes at the edge
   - Client-side checks are an additional layer
   - Double protection (middleware + component)

### Performance Considerations

**Concern:** "Is client-side checking slower?"

**Answer:** No, because:
- Middleware already protects the route (fast JWT check at edge)
- Client component checks session from NextAuth's internal cache
- Session API call is cached and reused across components
- Total overhead: ~50-100ms for initial session check

**Logs show:**
```
GET /api/auth/session 200 in 76ms  ✅ Fast cached response
GET /protected/user/dashboard 200 in 202ms  ✅ Quick render
```

## Authentication Flow

```
1. User navigates to /protected/user/dashboard
   ↓
2. Middleware checks JWT (getToken with request object) ✅ WORKS
   ↓
3. If authenticated, allows request to proceed
   ↓
4. Page component loads ("use client")
   ↓
5. useSession() checks authentication ✅ WORKS
   ↓
6. If authenticated, renders dashboard
   ↓
7. If not authenticated, redirects to /auth/login
```

## Why Server-Side JWT Check Failed

The `getServerToken()` helper had issues:

```tsx
// ❌ DOESN'T WORK RELIABLY IN NEXT.JS 15
export async function getServerToken() {
  const cookieStore = await cookies()
  const cookieName = secureCookie 
    ? "__Secure-next-auth.session-token" 
    : "next-auth.session-token"
  
  const sessionToken = cookieStore.get(cookieName)
  
  // Problem: Manual cookie extraction and passing to getToken()
  const token = await getToken({
    req: {
      headers: {
        cookie: `${cookieName}=${sessionToken.value}`
      }
    } as { headers: { cookie: string } },
    secret: process.env.NEXTAUTH_SECRET,
  })
  
  return token  // Often returns null
}
```

**Issues:**
- Cookie name might not match in all environments
- Passing a mock request object doesn't work properly
- `getToken()` expects a real NextRequest, not a partial object
- Works in middleware (has real request), fails in components

## Recommendations

### For Protected Routes

**Use client components with `useSession()`:**
```tsx
"use client"

export default function ProtectedPage() {
  const { status } = useSession()
  
  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/login")
    }
  }, [status])
  
  if (status !== "authenticated") return null
  
  return <YourContent />
}
```

### For Server Components That Need User Data

**Use NextAuth's `auth()` function:**
```tsx
import { auth } from "@/lib/auth/config"

export default async function ServerPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/login")
  }
  
  return <YourContent user={session.user} />
}
```

### For Middleware (Already Working)

**Keep using `getToken()`:**
```tsx
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,  // ✅ Real request object
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  // Works perfectly!
}
```

## Testing

After the fix, verify:

1. ✅ Dashboard loads without redirect loop
2. ✅ Account page loads without redirect loop
3. ✅ Unauthenticated users are redirected to login
4. ✅ No flash of content before redirect
5. ✅ Session data is available in components

Expected logs:
```
GET /api/auth/session 200 in 76ms
GET /protected/user/dashboard 200 in 202ms
✅ No redirect to /auth/login
```

## Cleanup Tasks

Consider removing unused files:
- ❌ `src/lib/auth/get-server-token.ts` (no longer needed)
- ❌ `src/components/auth/ProtectedPageWrapper.tsx` (if not used elsewhere)

## Related Issues

- Similar issue occurred earlier with JWT implementation causing infinite loops
- Root cause was always the same: trying to manually extract tokens in Server Components
- Solution is always: use client components with `useSession()` or server components with `auth()`

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
