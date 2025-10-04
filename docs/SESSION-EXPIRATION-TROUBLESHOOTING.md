# Session Expiration Issue - Root Cause & Solution

## Problem
User is still logged in even though the session appears expired in the database.

## Root Cause Analysis

### 1. **JWT Strategy vs Database Sessions**
- Your app uses `session: { strategy: "jwt" }` in NextAuth config
- This means **database sessions are NOT used** for authentication
- The `sessions` table data you see is either:
  - Old/unused data from a previous configuration
  - Tracking data only (not used for actual authentication)
- Authentication is done via JWT tokens stored in HTTP-only cookies

### 2. **When maxAge Takes Effect**
The `maxAge: 24 * 60 * 60` configuration we added only affects:
- **New JWT tokens created AFTER the server restart**
- **New logins AFTER the configuration change**

Your current JWT token was issued **BEFORE** we added maxAge, so it:
- Has no expiration (exp claim might be missing or very far in future)
- Will remain valid until explicitly invalidated
- Won't be affected by the new configuration

### 3. **Why Middleware Isn't Blocking**
The middleware checks `token.exp < currentTimestamp`, but:
- Your old token might not have an `exp` claim
- Or the `exp` claim is set very far in the future
- Middleware only blocks if exp exists AND is expired

## Solution

### Option 1: Force Logout (Immediate - RECOMMENDED)
Clear the current JWT token to force a fresh login with new expiration:

```bash
# In your browser (while on localhost:3000):
# 1. Open DevTools (F12)
# 2. Go to Application/Storage > Cookies
# 3. Delete cookies starting with "next-auth.session-token"
# 4. Refresh the page
# 5. Log in again
```

After this, the new JWT token will have the 24-hour expiration.

### Option 2: Server-Side Token Invalidation
Add a mechanism to invalidate old tokens:

```typescript
// In middleware.ts, add after getting the token:
if (token && !token.exp) {
  // Old token without expiration - force re-login
  console.log('[MIDDLEWARE] ⚠️ Token missing expiration claim, forcing re-login');
  return NextResponse.redirect(new URL('/auth/login?error=SessionInvalid', request.url));
}

// Also check if token is too old (e.g., issued before we added maxAge)
const configChangeDate = new Date('2025-10-04T00:00:00Z').getTime() / 1000;
if (token && token.iat && token.iat < configChangeDate) {
  console.log('[MIDDLEWARE] ⚠️ Token issued before security update, forcing re-login');
  return NextResponse.redirect(new URL('/auth/login?error=SecurityUpdate', request.url));
}
```

### Option 3: Test Your Current Token
Run the test script to see your current token's expiration:

```bash
# 1. Get your JWT token from browser cookies
# 2. Run:
npx tsx scripts/test-jwt-expiration.ts <your-token>
```

## Verification Steps

1. **Clear browser cookies** (delete next-auth.session-token)
2. **Restart dev server** (kill port 3000 process and restart)
3. **Log in fresh** to get new JWT token
4. **Check the token** using the test script
5. **Wait or manipulate time** to test expiration
6. **Try accessing protected route** - should redirect to login

## Expected Behavior After Fix

### With New JWT Token:
- Token created with `exp` = issuedAt + 86400 seconds (24 hours)
- Middleware validates expiration on every request
- After 24 hours, user is redirected to `/auth/login?error=SessionExpired`
- Login page shows: "Your session has expired. Please log in again."

### Database Sessions Table:
- **Will NOT be used** for authentication (JWT strategy)
- Can be used for tracking/audit purposes only
- Consider removing or repurposing if not needed

## Testing Session Expiration

### Method 1: Wait 24 Hours
- Log in fresh
- Wait 24 hours
- Try accessing protected route
- Should redirect to login

### Method 2: Manually Expire Token (Development Only)
Temporarily reduce maxAge for testing:

```typescript
// In src/config/auth.ts (TESTING ONLY)
session: { 
  strategy: "jwt",
  maxAge: 60, // 1 minute for testing
}
```

Then:
1. Restart server
2. Log in fresh
3. Wait 1 minute
4. Access protected route
5. Should redirect to login
6. **Remember to change back to 24 hours!**

## Next Steps

1. **Immediate**: Force logout (clear cookies) and log in again
2. **Verify**: Use test script to confirm new token has 24h expiration
3. **Optional**: Add middleware checks for old tokens (Option 2)
4. **Optional**: Test with reduced maxAge (Method 2)
5. **Production**: Ensure all users get fresh tokens (they'll naturally re-login)

## Additional Security Recommendations

1. **Add Token Versioning**: Add a `tokenVersion` to detect invalidated tokens
2. **Add Revocation List**: Track invalidated tokens (for logout/security)
3. **Add Refresh Tokens**: For better UX with sliding expiration
4. **Monitor Token Age**: Alert on tokens older than expected

## Files Modified

- ✅ `src/config/auth.ts` - Added maxAge: 24 * 60 * 60
- ✅ `middleware.ts` - Added token.exp validation
- ✅ `src/app/auth/login/page.tsx` - Added SessionExpired error display
- ✅ `scripts/test-jwt-expiration.ts` - Created token testing utility

## Summary

The session expiration IS working for NEW tokens, but your current token was created before we added the expiration configuration. Simply log out and log in again (or clear cookies) to get a fresh token with the 24-hour expiration.
