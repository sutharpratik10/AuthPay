# Secure Password Reset Implementation

## 🔒 Security Vulnerability Fixed

### Previous Vulnerability
The forgot password flow had **critical security vulnerabilities**:

1. **URL Parameter Manipulation** - Users could access any step by modifying URL parameters:
   ```
   /auth/forgot-password?step=reset&email=victim@example.com
   ```

2. **Client-Side Only Validation** - All security checks were in React state (easily bypassed via DevTools)

3. **No Server-Side Session Tracking** - Server didn't verify the flow sequence

4. **Code Verification Bypass** - Attackers could skip verification and call reset API directly

---

## ✅ Secure Solution: Token-Based Flow

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURE PASSWORD RESET FLOW                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1: Request Reset                                       │
│  ┌──────────────────────────────────────────────────┐       │
│  │ User enters email                                 │       │
│  │   ↓                                               │       │
│  │ Server generates:                                 │       │
│  │   • 6-digit code (sent via email)                │       │
│  │   • sessionToken (64-char random)                │       │
│  │ Returns: sessionToken to client                  │       │
│  └──────────────────────────────────────────────────┘       │
│                         ↓                                     │
│  Step 2: Verify Code                                         │
│  ┌──────────────────────────────────────────────────┐       │
│  │ User enters code + sessionToken                   │       │
│  │   ↓                                               │       │
│  │ Server validates:                                 │       │
│  │   • code matches                                  │       │
│  │   • sessionToken matches                          │       │
│  │   • not expired                                   │       │
│  │ Generates: verifiedToken (64-char random)        │       │
│  │ Updates: verifiedAt timestamp                    │       │
│  │ Returns: verifiedToken to client                 │       │
│  └──────────────────────────────────────────────────┘       │
│                         ↓                                     │
│  Step 3: Reset Password                                      │
│  ┌──────────────────────────────────────────────────┐       │
│  │ User enters new password + verifiedToken         │       │
│  │   ↓                                               │       │
│  │ Server validates:                                 │       │
│  │   • verifiedToken exists                          │       │
│  │   • verifiedAt is set (proof of verification)    │       │
│  │   • not expired                                   │       │
│  │ Updates: password hash                           │       │
│  │ Deletes: OTP record (one-time use)              │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Changes

### Added Fields to `otp_codes` Table

```sql
ALTER TABLE "otp_codes" ADD COLUMN "session_token" varchar(64);
ALTER TABLE "otp_codes" ADD COLUMN "verified_token" varchar(64);
ALTER TABLE "otp_codes" ADD COLUMN "verified_at" timestamp;
```

### Field Descriptions

| Field | Type | Purpose |
|-------|------|---------|
| `session_token` | varchar(64) | Random token generated when email is sent. Required for code verification. |
| `verified_token` | varchar(64) | Random token generated after code is verified. Required for password reset. |
| `verified_at` | timestamp | Timestamp when code was verified. Proves user went through proper flow. |

---

## 🔐 API Endpoints

### 1. POST `/api/auth/forgot-password` (Step 1)

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset code sent to your email",
  "sessionToken": "a1b2c3d4e5f6...64-char-random-string"
}
```

**Security Features:**
- ✅ Always returns success (prevents email enumeration)
- ✅ Generates 6-digit code (sent via email)
- ✅ Generates sessionToken (returned to client)
- ✅ 15-minute expiration
- ✅ Deletes old reset codes for same user

---

### 2. POST `/api/auth/verify-reset-code` (Step 2) 🆕

**Request:**
```json
{
  "code": "123456",
  "sessionToken": "a1b2c3d4e5f6...from-step-1"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Code verified successfully",
  "verifiedToken": "x9y8z7w6v5u4...64-char-random-string"
}
```

**Security Validations:**
- ✅ Code matches
- ✅ sessionToken matches (proves user went through Step 1)
- ✅ Code type is `password_reset`
- ✅ Code is still valid (`isValid = true`)
- ✅ Not expired
- ✅ Generates verifiedToken
- ✅ Sets verifiedAt timestamp

---

### 3. POST `/api/auth/reset-password` (Step 3) 🔒 SECURED

**Request:**
```json
{
  "verifiedToken": "x9y8z7w6v5u4...from-step-2",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Security Validations:**
- ✅ verifiedToken exists in database
- ✅ verifiedAt timestamp is set (proves code was verified)
- ✅ Code type is `password_reset`
- ✅ Code is still valid
- ✅ Not expired
- ✅ Password meets requirements (≥8 characters)
- ✅ Hashes password with bcrypt
- ✅ Deletes OTP record (one-time use)

---

## 🛡️ Security Improvements

### What Was Fixed

| Vulnerability | Before | After |
|---------------|--------|-------|
| **URL Manipulation** | ❌ Anyone could access reset page with `?step=reset&email=victim@example.com` | ✅ URL parameters removed. Flow enforced by server-side tokens |
| **Client Bypass** | ❌ Attackers could manipulate React state via DevTools | ✅ All validation server-side. Client state doesn't matter |
| **Code Verification Skip** | ❌ Could call reset API with just the code | ✅ Must have verifiedToken (only obtainable after verification) |
| **Step Sequence** | ❌ Could skip steps | ✅ Token chain enforces: email → verify → reset |
| **Email Enumeration** | ❌ Different errors revealed if email exists | ✅ Always returns success message |
| **Token Reuse** | ❌ Codes could be reused | ✅ OTP deleted after successful reset (one-time use) |

### Attack Prevention Matrix

| Attack Vector | Prevention |
|---------------|------------|
| **Direct API calls without going through flow** | ✅ Requires sessionToken → verifiedToken chain |
| **DevTools state manipulation** | ✅ Client state is irrelevant. Server validates tokens |
| **URL parameter tampering** | ✅ No URL parameters used. Flow stored server-side |
| **Code reuse after password reset** | ✅ OTP record deleted after use |
| **Expired token usage** | ✅ All operations check expiration |
| **Concurrent reset attempts** | ✅ Old codes deleted when new request made |
| **Brute force code guessing** | ✅ 6-digit code + must have sessionToken |

---

## 📋 Frontend Changes

### State Management

```typescript
// OLD - Client-side validation (INSECURE)
const [validatedSteps, setValidatedSteps] = useState<Set<Step>>(...)
const [verifiedCode, setVerifiedCode] = useState<string | null>(null)

// NEW - Server-provided tokens (SECURE)
const [sessionToken, setSessionToken] = useState<string | null>(null)
const [verifiedToken, setVerifiedToken] = useState<string | null>(null)
```

### Flow Enforcement

```typescript
// Step 1: Email submission stores sessionToken
const data = await fetch('/api/auth/forgot-password', { ... })
setSessionToken(data.sessionToken)

// Step 2: Code verification requires sessionToken
const data = await fetch('/api/auth/verify-reset-code', {
  body: JSON.stringify({ code, sessionToken })
})
setVerifiedToken(data.verifiedToken)

// Step 3: Password reset requires verifiedToken
await fetch('/api/auth/reset-password', {
  body: JSON.stringify({ verifiedToken, newPassword })
})
```

---

## 🧪 Testing

### Test Case 1: Normal Flow ✅
```bash
# Step 1
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# Returns: { sessionToken: "abc123..." }

# Step 2
curl -X POST http://localhost:3000/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"code":"123456","sessionToken":"abc123..."}'
# Returns: { verifiedToken: "xyz789..." }

# Step 3
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"verifiedToken":"xyz789...","newPassword":"NewPass123!"}'
# Returns: { success: true }
```

### Test Case 2: Skip Step 2 (Code Verification) ❌
```bash
# Try to reset without verifying code
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"verifiedToken":"fake-token","newPassword":"NewPass123!"}'
# Returns: { error: "Invalid or expired reset session" }
```

### Test Case 3: Wrong sessionToken ❌
```bash
# Use wrong sessionToken in Step 2
curl -X POST http://localhost:3000/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"code":"123456","sessionToken":"wrong-token"}'
# Returns: { error: "Invalid or expired code" }
```

### Test Case 4: Expired Token ❌
```bash
# Wait 16 minutes (past 15-minute expiration)
curl -X POST http://localhost:3000/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"code":"123456","sessionToken":"expired-token"}'
# Returns: { error: "Invalid or expired code" }
```

---

## 🔍 Code Walkthrough

### AuthService.initiatePasswordReset()

```typescript
// Generate secure random token
const crypto = await import('crypto');
const sessionToken = crypto.randomBytes(32).toString('hex'); // 64 chars

// Store in database with code
await db.insert(otpCodes).values({
  userId: user.id,
  code: resetCode,
  type: "password_reset",
  expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  sessionToken, // CRITICAL: Links email step to verification
});

return { success: true, sessionToken };
```

### Verify Reset Code Endpoint

```typescript
// SECURITY: Verify BOTH code and sessionToken
const resetCode = await db.query.otpCodes.findFirst({
  where: and(
    eq(otpCodes.code, code),
    eq(otpCodes.sessionToken, sessionToken), // Prevents bypass
    eq(otpCodes.type, 'password_reset'),
    gt(otpCodes.expiresAt, new Date())
  )
});

// Generate verified token
const verifiedToken = crypto.randomBytes(32).toString('hex');

// Mark as verified
await db.update(otpCodes).set({ 
  verifiedToken,
  verifiedAt: new Date() // Proof of verification
});
```

### Reset Password with Verified Token

```typescript
// SECURITY: Require verifiedToken AND verifiedAt
const resetCode = await db.query.otpCodes.findFirst({
  where: and(
    eq(otpCodes.verifiedToken, verifiedToken),
    eq(otpCodes.type, 'password_reset'),
    gt(otpCodes.expiresAt, new Date())
  )
});

// CRITICAL CHECK: Ensure code was actually verified
if (!resetCode.verifiedAt) {
  return { error: "Invalid reset session. Please verify your code first." };
}

// Update password and delete OTP (one-time use)
await db.update(users).set({ password: hashedPassword });
await db.delete(otpCodes).where(eq(otpCodes.id, resetCode.id));
```

---

## 📝 Migration Instructions

### Step 1: Apply Database Migration
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### Step 2: Test the Flow
1. Go to `/auth/forgot-password`
2. Enter email → Check console for sessionToken
3. Enter code → Check console for verifiedToken
4. Set new password → Verify it works

### Step 3: Monitor Logs
Check server logs for:
```
[Password Reset] Session token generated for user: user@example.com
[Verify Reset Code] Code verified successfully
[Reset Password] Password reset successful
```

---

## 🚨 Important Notes

1. **Backward Compatibility**: Old reset codes (without tokens) will NOT work with new flow
2. **Token Expiration**: All tokens expire after 15 minutes
3. **One-Time Use**: OTP records are deleted after successful password reset
4. **Email Enumeration**: Always returns success even if email doesn't exist
5. **Page Refresh**: Users get warning if refreshing during flow (they'll lose progress)

---

## 📊 Performance Impact

- **Database**: 3 additional varchar columns (minimal impact)
- **API Calls**: Same number of calls (3 total)
- **Response Time**: Negligible (token generation < 1ms)
- **Security**: Massive improvement 🔒

---

## ✅ Checklist

- [x] Database schema updated (3 new columns)
- [x] Migration applied
- [x] `/api/auth/forgot-password` returns sessionToken
- [x] `/api/auth/verify-reset-code` endpoint created
- [x] `/api/auth/reset-password` requires verifiedToken
- [x] Frontend uses token-based flow
- [x] URL parameters removed
- [x] Client-side validation removed
- [x] Server-side token chain enforced
- [x] Email enumeration prevented
- [x] One-time use OTP
- [x] Page refresh warning added
- [x] Documentation complete

---

## 🎯 Summary

**Before**: Insecure URL-based flow vulnerable to manipulation
**After**: Secure server-side token chain with proof-of-verification

The password reset flow is now **production-ready** and follows **industry best practices** for secure password reset implementation.
