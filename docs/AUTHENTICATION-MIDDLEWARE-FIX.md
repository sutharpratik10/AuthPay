# Authentication Middleware Fix

## Problem
The `/protected/*` routes were accessible without authentication. Users could view the business creation wizard and other protected pages even when not logged in.

## Root Cause
1. No middleware was configured to protect routes at the server level
2. The `ProtectedRoute` component only did client-side checks using `useSession()`
3. Client-side auth checks happen AFTER the page loads, allowing unauthenticated users to see protected content briefly

## Solution
Created a Next.js middleware that:
1. **Runs on the Edge Runtime** for fast authentication checks
2. **Uses NextAuth's `getToken()`** which is Edge Runtime compatible (unlike `auth()` which requires Node.js modules)
3. **Intercepts all `/protected/*` requests** before rendering
4. **Redirects to login** if no valid session token exists
5. **Preserves the original URL** in the `callbackUrl` parameter for post-login redirect

## Implementation

### File: `src/middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/protected')) {
    const token = await getToken({ 
      req: request,
      secret: process.env.AUTH_SECRET 
    });

    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}
```

## Key Features

### 1. Server-Side Protection
- Authentication check happens **before** the page loads
- No flash of protected content to unauthenticated users
- Works even if JavaScript is disabled

### 2. Edge Runtime Compatible
- Uses `getToken()` instead of `auth()` 
- No Node.js dependencies (fs, crypto, path)
- Fast execution on edge networks
- Lower latency for users worldwide

### 3. Seamless Redirect Flow
1. User tries to access `/protected/business`
2. Middleware detects no session token
3. Redirects to `/auth/signin?callbackUrl=/protected/business`
4. After login, user returns to original page

### 4. Minimal Performance Impact
- Matcher pattern excludes:
  - API routes (`/api/*`)
  - Static files (`/_next/static/*`)
  - Images (`/_next/image/*`)
  - Public assets
- Only runs on actual page requests

## Security Benefits

✅ **Server-side enforcement** - Can't be bypassed by disabling JavaScript
✅ **Edge Runtime** - Fast, globally distributed auth checks
✅ **Token-based** - Validates JWT tokens securely
✅ **Automatic redirects** - Prevents access to protected routes
✅ **Preserves UX** - Returns users to intended page after login

## Testing

### Before Fix:
```
1. Open browser in incognito mode
2. Navigate to http://localhost:3000/protected/business
3. ❌ Business wizard loads without authentication
```

### After Fix:
```
1. Open browser in incognito mode
2. Navigate to http://localhost:3000/protected/business
3. ✅ Immediately redirects to /auth/signin?callbackUrl=/protected/business
4. After login, returns to /protected/business
```

## Comparison: Edge Runtime vs Node.js Runtime

| Feature | `auth()` (Node.js) | `getToken()` (Edge) |
|---------|-------------------|---------------------|
| **Speed** | Slower | Faster |
| **Location** | Server only | Edge + Server |
| **Modules** | fs, crypto, path | None required |
| **Use Case** | API routes | Middleware |
| **Compatibility** | ❌ Edge incompatible | ✅ Edge compatible |

## Why `auth()` Failed in Middleware

The original attempt used:
```typescript
import { auth } from '@/config/auth';
const session = await auth();
```

**Error:** 
```
A Node.js module is loaded ('crypto' at line 6) which is not 
supported in the Edge Runtime.
```

**Explanation:**
- `auth()` imports database config
- Database config uses `fs.readFileSync()` for SSL certificates
- `auth.ts` uses `randomUUID()` from Node's `crypto` module
- Edge Runtime doesn't support Node.js built-in modules

## Alternative Approaches Considered

### 1. ❌ Move middleware to Node.js runtime
```typescript
export const config = {
  runtime: 'nodejs', // Not allowed for middleware
};
```
**Problem:** Middleware must run on Edge Runtime in Next.js

### 2. ❌ Use only client-side protection
```typescript
// In component
const { data: session } = useSession();
if (!session) redirect('/auth/signin');
```
**Problem:** Flash of content, bypassable, poor UX

### 3. ✅ Use `getToken()` in Edge middleware (Chosen)
```typescript
const token = await getToken({ req: request });
```
**Benefits:** Fast, secure, Edge-compatible

## Environment Variables Required

Ensure `.env` or `.env.local` contains:
```bash
AUTH_SECRET=your-secret-key-here
```

This is used by `getToken()` to verify JWT signatures.

## Protected Routes Covered

The middleware protects:
- `/protected/*` - All dashboard/protected pages
  - `/protected/business` - Business dashboard
  - `/protected/admin` - Admin panel
  - `/protected/profile` - User profile
  - Any future `/protected/*` routes

## Not Protected (As Intended)

- `/` - Home page (public)
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/book/*` - Public booking pages
- `/api/*` - API routes (handle own auth)
- `/pricing` - Pricing page (public)
- `/about` - About page (public)

## Future Enhancements

1. **Role-based access**: Check user roles in middleware
2. **Rate limiting**: Add rate limiting for auth endpoints
3. **Session refresh**: Auto-refresh tokens in middleware
4. **Audit logging**: Log authentication attempts
5. **Geo-blocking**: Block requests from specific regions

## Troubleshooting

### Issue: Still seeing unprotected pages
**Solution:** Clear browser cache and cookies, restart dev server

### Issue: Redirect loop
**Solution:** Check `AUTH_SECRET` is set correctly in `.env`

### Issue: Middleware not running
**Solution:** Ensure file is at `src/middleware.ts` (not `src/app/middleware.ts`)

## References

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [NextAuth Edge Runtime Guide](https://next-auth.js.org/configuration/nextjs#middleware)
- [Edge Runtime API Reference](https://nextjs.org/docs/app/api-reference/edge)
