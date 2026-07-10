# AuthPay Security Audit Report

## Project Information

| Field | Details |
|---|---|
| **Date Started** | 2026-07-01 |
| **Last Updated** | 2026-07-01T10:30+05:30 |
| **Reviewer** | Principal Software Engineer / Staff Security Engineer / Senior Next.js Architect |
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL + Drizzle ORM |
| **Authentication** | NextAuth/Auth.js (JWT, OAuth, Email, Passwordless, TOTP 2FA) |
| **Authorization** | Role-Based Access Control (RBAC) |
| **Payments** | Razorpay + Stripe |
| **Status** | 🔴 IN PROGRESS |
| **Files Reviewed** | 29 |
| **Total Files Identified** | ~50+ security-relevant files |

---

## Executive Summary

> **Audit is in progress.** Two critical authentication configuration files have been reviewed. Multiple critical and high-severity issues have been identified, predominantly around the `skipPasswordCheck` authentication bypass mechanism, hardcoded fallback secrets, 2FA bypass patterns, and OAuth account linking security.

| Severity | Count |
|---|---|
| 🔴 Critical | 5 |
| 🟠 High | 7 |
| 🟡 Medium | 11 |
| 🔵 Low | 4 |
| ⚪ Informational | 4 |
| **Overall Risk Score** | **High — Critical issues present** |

---

## Audit Progress

| # | File | Status | 🔴 Crit | 🟠 High | 🟡 Med | 🔵 Low | ⚪ Info |
|---|------|--------|---------|---------|--------|--------|---------|
| 1 | `src/config/auth.ts` | ✅ Reviewed | 2 | 3 | 4 | 2 | 3 |
| 2 | `src/config/auth.config.ts` | ✅ Reviewed | 2 | 2 | 3 | 2 | 1 |
| 3 | `src/server/services/auth.ts` | ✅ Reviewed | 1 | 2 | 1 | 0 | 0 |
| 4 | `src/server/services/session.ts` | ✅ Reviewed | 0 | 0 | 0 | 1 | 0 |
| 5 | `src/server/services/totp.ts` | ✅ Reviewed | 0 | 1 | 0 | 1 | 0 |
| 6 | `src/lib/payments/providers/razorpay.ts` | ✅ Reviewed | 0 | 2 | 1 | 0 | 1 |
| 7 | `src/lib/payments/providers/stripe.ts` | ✅ Reviewed | 0 | 2 | 1 | 0 | 1 |
| 8 | `src/app/api/payments/razorpay-webhook/route.ts` | ✅ Reviewed | 1 | 1 | 0 | 0 | 1 |
| 9 | `src/app/api/payments/stripe-webhook/route.ts` | ✅ Reviewed | 1 | 0 | 0 | 1 | 3 |
| 10 | `src/server/db/schema/schema.ts` | ✅ Reviewed | 0 | 1 | 1 | 1 | 1 |
| 11 | `src/lib/rbac/rbac-service.ts` | ✅ Reviewed | 2 | 1 | 1 | 0 | 0 |

### Files Identified for Review (Priority Order)

#### 🔴 Critical Priority
- [✓] `src/config/auth.ts` — Auth.js core configuration
- [✓] `src/config/auth.config.ts` — Auth callbacks, JWT, session
- [✓] `src/server/services/auth.ts` — Auth business logic (18KB)
- [✓] `src/server/services/session.ts` — Session management (20KB)
- [✓] `src/server/services/totp.ts` — 2FA/TOTP implementation
- [✓] `src/lib/payments/providers/razorpay.ts` — Razorpay provider
- [✓] `src/lib/payments/providers/stripe.ts` — Stripe provider (8KB)
- [✓] `src/app/api/payments/razorpay-webhook/route.ts` — Razorpay webhook handler
- [✓] `src/app/api/payments/stripe-webhook/route.ts` — Stripe webhook handler
- [✓] `src/server/db/schema/schema.ts` — Database schema (30KB)
- [✓] `src/lib/rbac/rbac-service.ts` — RBAC engine (35KB)

#### 🟠 High Priority
- [✓] `src/lib/middleware/rate-limit.ts` — Rate limiting (14KB)
- [✓] `src/lib/middleware/rsc-protection.ts` — RSC protection (13KB)
- [✓] `src/lib/auth/session-validation.ts` — Session validation (7KB)
- [✓] `src/lib/rbac/policy-middleware.ts` — Policy middleware (7KB)
- [✓] `src/lib/rbac/routing-utils.ts` — RBAC routing utilities (7KB)
- [✓] `src/server/services/refund.ts` — Refund logic (17KB)
- [✓] `src/server/services/permissions.ts` — Permissions service
- [✓] `src/server/services/cleanup.ts` — Cleanup service
- [✓] `src/lib/payments/gateway-router.ts` — Payment gateway router
- [✓] `src/lib/payments/gateway.ts` — Payment gateway abstraction
- [ ] `src/app/api/auth/register/` — User registration
- [✓] `src/app/api/auth/validate-credentials/` — Credential validation
- [✓] `src/app/api/auth/forgot-password/` — Password reset initiation
- [✓] `src/app/api/auth/reset-password/` — Password reset execution
- [✓] `src/app/api/auth/verify-reset-code/` — Reset code verification
- [✓] `src/app/api/auth/verify-2fa/` — 2FA verification
- [✓] `src/app/api/auth/send-otp/` — OTP sending
- [✓] `src/app/api/auth/passwordless/` — Passwordless login
- [✓] `src/app/api/admin/*` — All admin API routes (12 routes)

#### 🟡 Medium Priority
- [ ] `src/server/services/email.ts` — Email service
- [ ] `src/server/services/email-queue.ts` — Email queue
- [ ] `src/server/services/location.ts` — Location service
- [ ] `src/server/services/subscription-plans.ts` — Subscription plans
- [ ] `src/lib/auth/password-strength.ts` — Password strength
- [ ] `src/lib/auth/role-utils.ts` — Role utilities
- [ ] `src/lib/auth/session-manager.ts` — Session manager
- [ ] `src/lib/auth/get-server-token.ts` — Server token retrieval
- [ ] `src/server/db/index.ts` — DB connection
- [ ] `src/server/db/ssl-config.ts` — SSL configuration
- [ ] `src/server/db/schema/relations.ts` — DB relations
- [ ] `next.config.ts` — Next.js configuration
- [ ] `drizzle.config.ts` — Drizzle configuration
- [ ] `instrumentation.ts` — Instrumentation
- [ ] `src/app/protected/layout.tsx` — Protected layout
- [ ] `src/lib/validations/*` — Validation schemas
- [ ] `src/routes/*` — Route definitions

#### 🔵 Low Priority
- [ ] `src/lib/swr-config.ts` — SWR configuration
- [ ] `src/lib/index.ts` — Library exports
- [ ] `src/contexts/*` — React contexts
- [ ] `src/hooks/*` — Custom hooks
- [ ] `src/components/*` — UI components (selective review)
- [ ] `ecosystem.config.js` — PM2 configuration
- [ ] `proxy.ts` — Proxy configuration
- [ ] `env.example` — Example env file

---

# Detailed Findings

---

## File 1: `src/config/auth.ts`

**Path:** [auth.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts)
**Lines:** 340 | **Size:** 14KB

### Overview

This is the **core NextAuth/Auth.js configuration file**. It initializes the NextAuth instance and exports `GET`, `POST`, `auth`, `signIn`, and `signOut`. It contains three critical callbacks:

1. **`signIn` callback** (lines 26–177): Handles OAuth provider sign-in with user creation/update, account linking, and suspension checks.
2. **`session` callback** (lines 178–199): Maps JWT token claims to the session object.
3. **`jwt` callback** (lines 200–336): Manages token enrichment, login tracking, security alerts, password-change session invalidation, and role resolution.

This file is **the most security-critical file in the entire application** — every authentication flow passes through it.

---

### Findings

---

#### AUTH-01 — Client-Controllable Authentication Bypass via `skipPasswordCheck`

| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-287](https://cwe.mitre.org/data/definitions/287.html) — Improper Authentication |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Category** | Authentication |
| **Location** | [auth.config.ts:42-52](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L42-L52), [auth.config.ts:79](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L79) |
| **Likelihood** | High |
| **Risk Score** | 10/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 4–8 hours |

**Description:**

The `skipPasswordCheck` parameter is accepted as a user-controllable credential field in the NextAuth Credentials provider. When set to `'true'`, it bypasses all password verification, account lockout checks, and 2FA enforcement. This value is passed directly from the client-side `signIn()` call.

**Root Cause:**

The `skipPasswordCheck` flag is designed to allow post-2FA and passwordless login flows to complete authentication without re-verifying the password. However, it is implemented as a **client-sent credential field**, meaning any HTTP client can send `skipPasswordCheck: 'true'` directly to the NextAuth `signIn` endpoint.

**Evidence:**

```typescript
// auth.config.ts:42 — Declared as a client-controllable credential
skipPasswordCheck: { label: "Skip Password Check", type: "text" },

// auth.config.ts:52 — Parsed from client input
const skipPasswordCheck = credentials.skipPasswordCheck === 'true';

// auth.config.ts:79 — Bypasses all password verification
if (!skipPasswordCheck) {
  // ... entire password verification block is skipped
}
```

The client-side code in [auth-context.tsx:119](file:///d:/Pratik/Dev/Projects/AuthPay/src/contexts/auth-context.tsx#L119) sends this directly:

```typescript
const result = await signIn("credentials", {
  email,
  password,
  skipPasswordCheck,  // Client-controlled value
  redirect: false,
});
```

**Business Impact:**

- **Complete authentication bypass**: Any attacker who knows a valid email address can authenticate as that user without a password.
- **2FA bypass**: The password check skip also bypasses the 2FA requirement check at line 122.
- **Account lockout bypass**: The lockout check at line 71 is inside the `!skipPasswordCheck` block — but wait, actually the lockout check is at line 71 which is *before* the `skipPasswordCheck` branch at line 79. Let me re-check...

Actually, looking more carefully at [auth.config.ts:70-73](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L70-L73):

```typescript
// Check if account is locked — this runs REGARDLESS of skipPasswordCheck ✓
if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
  throw new Error("Account is temporarily locked...");
}
```

The lockout check is outside the `skipPasswordCheck` branch, so it IS still enforced. However, the password and 2FA checks are completely bypassed.

**Exploitation Scenario:**

An attacker sends a direct POST request to `/api/auth/callback/credentials` with:
```
email=victim@example.com&password=anything&skipPasswordCheck=true
```
This authenticates as the victim without needing their password or 2FA code.

**Recommendation:**

Never trust client-side flags for security-critical decisions. The `skipPasswordCheck` mechanism should be replaced with a **server-side-only signed token verification** system.

**Improved Implementation:**

```typescript
// auth.config.ts — Remove skipPasswordCheck from credentials
credentials: {
  email: { label: "Email", type: "email" },
  password: { label: "Password", type: "password" },
  authToken: { label: "Auth Token", type: "text" }, // Signed server-side token
},

async authorize(credentials) {
  if (!credentials?.email) return null;
  const email = credentials.email as string;

  const user = await db.query.users.findFirst({
    where: (usersTable) => eq(usersTable.email, email),
    with: { userPreferences: true }
  });
  if (!user) return null;

  // Check lockout
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    throw new Error("Account is temporarily locked.");
  }

  // If authToken is provided, verify it server-side
  if (credentials.authToken) {
    const isValid = await verifyServerSideAuthToken(
      credentials.authToken as string,
      user.id,
      email
    );
    if (!isValid) return null;
  } else {
    // Normal password flow
    if (!credentials.password || !user.password) return null;
    const isPasswordValid = await bcrypt.compare(
      credentials.password as string,
      user.password
    );
    if (!isPasswordValid) {
      await incrementFailedAttempts(user);
      return null;
    }
    await resetFailedAttempts(user);

    // Check 2FA
    if (user.userPreferences?.twoFactorAuth === true) {
      return null; // Redirect to 2FA flow
    }
  }

  return { id: user.id, email: user.email, name: user.name, isEmailVerified: user.isEmailVerified ?? false };
}

// Server-side token verification function
async function verifyServerSideAuthToken(token: string, userId: string, email: string): Promise<boolean> {
  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET!, {
      algorithms: ['HS256'],
    }) as { userId: string; email: string; purpose: string; iat: number };

    // Verify purpose, user, and that token is recent (< 5 min)
    return (
      decoded.purpose === '2fa-completion' &&
      decoded.userId === userId &&
      decoded.email === email &&
      Date.now() / 1000 - decoded.iat < 300
    );
  } catch {
    return false;
  }
}
```

**Best Practice:** Authentication bypass flags must never be exposed as client-controllable inputs. Use cryptographically signed, single-use server-side tokens with purpose binding and short expiration.

**Status:** 🔴 Open

---

#### AUTH-02 — Hardcoded Fallback Secret in JWT Verification

| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) — Use of Hard-coded Credentials |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Category** | Security / Secrets |
| **Location** | [verify-2fa/route.ts:62](file:///d:/Pratik/Dev/Projects/AuthPay/src/app/api/auth/verify-2fa/route.ts#L62), [generate-temp-token/route.ts:101](file:///d:/Pratik/Dev/Projects/AuthPay/src/app/api/auth/generate-temp-token/route.ts#L101) |
| **Likelihood** | Medium |
| **Risk Score** | 9/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 30 minutes |

**Description:**

Multiple files use a hardcoded `'fallback-secret'` string as the JWT signing/verification key when environment variables are missing:

```typescript
// verify-2fa/route.ts:62
jwt.verify(tempToken, process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret')

// generate-temp-token/route.ts:101
jwt.sign({ ... }, process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret', ...)
```

**Root Cause:** Defensive programming gone wrong — instead of failing fast when the secret is missing, the code silently falls back to a publicly known, weak secret.

**Business Impact:**
- If either `NEXTAUTH_SECRET` or `AUTH_SECRET` env vars are unset in production, all JWTs are signed with a publicly known string.
- Attackers can forge arbitrary JWTs, bypassing all token-based authentication (2FA verification, temp tokens, etc.).
- Combined with AUTH-01, this creates a complete zero-click authentication bypass chain.

**Recommendation:**

```typescript
// Create a utility function that throws on missing secret
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('FATAL: AUTH_SECRET environment variable is not set. Refusing to start.');
  }
  if (secret.length < 32) {
    throw new Error('FATAL: AUTH_SECRET must be at least 32 characters.');
  }
  return secret;
}

// Use it everywhere
jwt.verify(tempToken, getAuthSecret());
jwt.sign({ ... }, getAuthSecret(), { expiresIn: '15m' });
```

**Best Practice:** Applications must fail hard and refuse to operate when cryptographic secrets are missing. Never use fallback values for secrets.

**Status:** 🔴 Open

---

#### AUTH-03 — 2FA Bypass Through Credential Flow

| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-308](https://cwe.mitre.org/data/definitions/308.html) — Use of Single-factor Authentication |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Category** | Authentication / 2FA |
| **Location** | [auth.config.ts:120-126](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L120-L126) |
| **Likelihood** | High |
| **Risk Score** | 9/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 4 hours |

**Description:**

When 2FA is enabled and a user provides valid credentials, the `authorize` function returns `null` (line 125) to signal to the frontend that 2FA is required. However, this is a **client-side enforcement only**. The actual NextAuth callback returns `null`, and the frontend is expected to redirect to the 2FA page. But:

1. The return of `null` is identical to "invalid credentials" — there's no server-side mechanism to enforce the 2FA step.
2. Combined with AUTH-01 (`skipPasswordCheck`), an attacker can bypass 2FA entirely by sending `skipPasswordCheck: 'true'`.
3. Even without AUTH-01, the 2FA check at [line 121-126](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L121-L126) relies on the client to enforce the redirect — a direct API call bypasses it.

**Evidence:**

```typescript
// auth.config.ts:120-126
const has2FA = user.userPreferences?.twoFactorAuth === true;
if (has2FA) {
  // Return null to indicate failed authentication (2FA required)
  // The frontend will handle checking 2FA status and redirecting
  return null;  // ← Client-side enforcement only!
}
```

The comment on line 124 explicitly states: *"The frontend will handle checking 2FA status and redirecting"*. This is a fundamentally insecure pattern.

**Business Impact:**
- Any user with 2FA enabled can have their 2FA completely bypassed.
- Defeats the purpose of implementing 2FA entirely.
- Users with the most security-conscious settings are still vulnerable.

**Recommendation:**

2FA enforcement must happen server-side. The `authorize` callback should issue a **purpose-bound, single-use, server-side token** that gates access to the 2FA verification step, and the final session should only be issued after the 2FA step completes. The `skipPasswordCheck` mechanism should be replaced with this token-based approach (see AUTH-01 fix).

**Status:** 🔴 Open

---

#### AUTH-04 — Insecure OAuth Account Linking (Account Takeover)

| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-284](https://cwe.mitre.org/data/definitions/284.html) — Improper Access Control |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Category** | Authentication / OAuth |
| **Location** | [auth.ts:38-109](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L38-L109) |
| **Likelihood** | Medium |
| **Risk Score** | 8/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 4 hours |

**Description:**

The `signIn` callback performs automatic OAuth account linking based solely on email address matching. When a user signs in via an OAuth provider (Google, GitHub, etc.), the system looks up existing users by email and automatically links the OAuth account to the existing user — without requiring any verification that the OAuth user actually controls the existing account.

**Evidence:**

```typescript
// auth.ts:39-43
let existingUser: any = null;
existingUser = await db.query.users.findFirst({
  where: eq(users.email, user.email!),  // Lookup by email alone
}) as any;

// auth.ts:86-104 — Automatic linking with no verification
if (!existingAccount) {
  await db.insert(accounts).values({
    userId: existingUser.id,     // Links to existing user!
    provider: account.provider!, // Without verifying ownership
    providerAccountId: account.providerAccountId!,
    ...
  });
}

// auth.ts:108 — Session is created for the existing user
user.id = existingUser.id;
return true;
```

**Exploitation Scenario:**

1. Victim registers with email `victim@example.com` using password-based auth.
2. Attacker creates a GitHub account with `victim@example.com` as a secondary/verified email.
3. Attacker signs in via GitHub OAuth.
4. The system finds the victim's existing account, links the attacker's GitHub account, and authenticates the attacker as the victim.
5. Attacker now has full access to the victim's account, subscriptions, and payment data.

**Business Impact:**
- Complete account takeover for any user whose email is known.
- Attacker gains access to payment methods, subscription data, and personal information.
- The victim's `isEmailVerified` is set to `true` as a side effect (line 62).

**Recommendation:**

```typescript
// Require authenticated session for linking new OAuth accounts to existing users
if (existingUser) {
  if (existingUser.isSuspended) {
    return "/auth/error?error=AccountSuspended";
  }

  // Check if user originally registered with email+password
  const hasPasswordAuth = !!existingUser.password;

  if (hasPasswordAuth && !existingAccount) {
    // Do NOT auto-link. Require the user to be logged in first
    // and explicitly link the OAuth account from settings.
    return "/auth/error?error=AccountExists&provider=" + account.provider;
  }

  // Only auto-link if the user was originally created via OAuth
  // (no password set) and they're adding another OAuth provider
  if (!existingAccount) {
    // Additional verification: send email confirmation before linking
    await sendAccountLinkVerification(existingUser.email, account.provider);
    return "/auth/error?error=LinkVerificationRequired";
  }

  user.id = existingUser.id;
  return true;
}
```

**Best Practice:** Never auto-link OAuth accounts to existing accounts based solely on email matching. Require either: (a) the user to be already authenticated, or (b) explicit email verification via a confirmation link.

**Status:** 🔴 Open

---

#### AUTH-05 — IP Address Spoofing via Unvalidated Headers

| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-346](https://cwe.mitre.org/data/definitions/346.html) — Origin Validation Error |
| **OWASP** | A04:2021 — Insecure Design |
| **Category** | Security / Logging |
| **Location** | [auth.ts:220](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L220) |
| **Likelihood** | High |
| **Risk Score** | 7/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 1 hour |

**Description:**

The IP address used for login tracking, security alerts, and geolocation is extracted from `x-forwarded-for` without validation:

```typescript
const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
```

**Root Cause:**
- `x-forwarded-for` can contain multiple comma-separated IPs. Taking the full header value can cause parsing issues.
- Without a trusted proxy configuration, clients can spoof this header.
- The spoofed IP is stored in `loginHistory` and used for security alerts, making it useless for forensic analysis.

**Business Impact:**
- Security alert emails show attacker-controlled IP/location data, misleading the victim.
- Login history records are unreliable for incident investigation.
- Rate limiting based on IP (if any) can be bypassed by spoofing.

**Recommendation:**

```typescript
function getClientIP(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP (leftmost = original client in standard proxies)
    // In production, validate against known proxy IPs
    const firstIP = forwarded.split(',')[0]?.trim();
    if (firstIP && isValidIP(firstIP)) return firstIP;
  }
  const realIP = headersList.get("x-real-ip");
  if (realIP && isValidIP(realIP)) return realIP;
  return "unknown";
}

function isValidIP(ip: string): boolean {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4.test(ip) || ipv6.test(ip);
}
```

**Status:** 🔴 Open

---

#### AUTH-06 — JWT Token Contains Stale Role Data (Privilege Escalation Window)

| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-613](https://cwe.mitre.org/data/definitions/613.html) — Insufficient Session Expiration |
| **OWASP** | A01:2021 — Broken Access Control |
| **Category** | Authorization / Session |
| **Location** | [auth.ts:294-332](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L294-L332) |
| **Likelihood** | Medium |
| **Risk Score** | 7/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 2 hours |

**Description:**

The JWT callback only refreshes role and email verification data from the database every **5 minutes** (line 298). During this window, if an admin demotes a user or suspends an account, the user retains their previous elevated role in the JWT.

**Evidence:**

```typescript
// auth.ts:295-298
const shouldRefresh = !token.isEmailVerified ||
  !token.role ||
  !token.lastVerifiedCheck ||
  (Date.now() - (token.lastVerifiedCheck as number)) > 5 * 60 * 1000; // 5 minutes
```

**Critical Design Issues:**

1. **Negative logic flaw**: `shouldRefresh` is `true` when `!token.isEmailVerified` — this means once a user verifies their email, `token.isEmailVerified` becomes `true`, and the condition `!token.isEmailVerified` becomes `false`. If `token.role` is also set, the refresh will only happen every 5 minutes. This is correct behavior but creates a 5-minute privilege escalation window.

2. **No suspension check**: The JWT refresh (lines 301-327) checks `passwordChangedAt` but does NOT check `isSuspended`. A suspended user retains their session for up to 5 minutes.

3. **Single role assumption**: Line 325 takes only the first role: `token.role = userRoles[0]`. If a user has multiple roles, only one is used, which could lead to privilege issues.

**Business Impact:**
- A user whose admin role is revoked retains admin access for up to 5 minutes.
- A suspended user can continue operating for up to 5 minutes.
- In a payment/financial application, 5 minutes is enough to cause significant damage.

**Recommendation:**

```typescript
// Add suspension check in the refresh block
if (userRecord) {
  // Check suspension
  const userStatus = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, token.sub as string),
    columns: { isSuspended: true, isActive: true },
  });

  if (userStatus?.isSuspended || !userStatus?.isActive) {
    return { ...token, error: "SessionExpired" };
  }

  // Check password change (existing logic)
  if (userRecord.passwordChangedAt && token.iat) { ... }

  // Reduce refresh interval to 60 seconds for high-security apps
  token.lastVerifiedCheck = Date.now();
}
```

Also consider reducing the refresh interval from 5 minutes to 60 seconds, or implementing a server-side session revocation mechanism (e.g., a `sessions` table with a `revokedAt` column checked on every request).

**Status:** 🔴 Open

---

#### AUTH-07 — OAuth Tokens Stored Without Encryption

| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-312](https://cwe.mitre.org/data/definitions/312.html) — Cleartext Storage of Sensitive Information |
| **OWASP** | A02:2021 — Cryptographic Failures |
| **Category** | Security / Data Protection |
| **Location** | [auth.ts:88-100](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L88-L100), [auth.ts:148-161](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L148-L161) |
| **Likelihood** | Medium |
| **Risk Score** | 6/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 4 hours |

**Description:**

OAuth `refresh_token`, `access_token`, and `id_token` values are stored in the database in plaintext:

```typescript
refresh_token: account.refresh_token ? String(account.refresh_token) : null,
access_token: account.access_token ? String(account.access_token) : null,
id_token: account.id_token ? String(account.id_token) : null,
```

**Business Impact:**
- A database breach exposes all OAuth tokens, allowing attackers to access users' Google, GitHub, Facebook, Microsoft, and Apple accounts.
- Refresh tokens can be used to generate new access tokens indefinitely.
- This violates data protection regulations (GDPR, CCPA) regarding sensitive credential storage.

**Recommendation:**

Encrypt OAuth tokens at rest using the same AES-256-GCM encryption used for TOTP secrets (referenced by `TOTP_ENCRYPTION_KEY` in env.example). Create a shared encryption utility:

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex');

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptToken(ciphertext: string): string {
  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

**Status:** 🔴 Open

---

#### AUTH-08 — Non-Atomic OAuth User Creation (Race Condition)

| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-362](https://cwe.mitre.org/data/definitions/362.html) — Race Condition |
| **OWASP** | A04:2021 — Insecure Design |
| **Category** | Reliability / Database |
| **Location** | [auth.ts:110-170](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L110-L170) |
| **Likelihood** | Medium |
| **Risk Score** | 6/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 3 hours |

**Description:**

New OAuth user creation involves **three separate, non-transactional database inserts**:

1. Insert into `users` (line 114)
2. Insert into `userPreferences` (line 132)
3. Insert into `accounts` (line 149)

If step 2 or 3 fails, the user record exists but is in an inconsistent state (no preferences, no linked account). Additionally, if two concurrent OAuth sign-in requests arrive for the same new user (e.g., user clicks the button twice rapidly), both may pass the `existingUser` check and attempt to create duplicate user records.

**Evidence:**

```typescript
// Step 1: Insert user
await db.insert(users).values({ id: newUserId, ... });

// Step 2: Insert preferences — if this fails, user exists without preferences
await db.insert(userPreferences).values({ userId: newUserId, ... });

// Step 3: Insert account — if this fails, user exists without OAuth link
await db.insert(accounts).values({ userId: newUserId, ... });
```

Each step has its own try/catch that returns an error redirect, leaving the database in a partial state.

**Recommendation:**

Wrap all inserts in a database transaction:

```typescript
await db.transaction(async (tx) => {
  await tx.insert(users).values({ id: newUserId, ... });
  await tx.insert(userPreferences).values({ userId: newUserId, ... });
  await tx.insert(accounts).values({ userId: newUserId, ... });
});
```

Add a unique constraint on `users.email` to prevent duplicate creation from race conditions.

**Status:** 🔴 Open

---

#### AUTH-09 — `trustHost: true` Without Validation

| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-346](https://cwe.mitre.org/data/definitions/346.html) — Origin Validation Error |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Category** | Security / Configuration |
| **Location** | [auth.ts:24](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L24) |
| **Likelihood** | Medium |
| **Risk Score** | 6/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 30 minutes |

**Description:**

`trustHost: true` is set unconditionally. In Auth.js, this tells the library to trust the `Host` header from incoming requests without validation. In production behind certain proxy configurations, this can lead to host header injection attacks.

**Evidence:**

```typescript
trustHost: true, // Line 24 — Always trusts the Host header
```

**Business Impact:**
- Host header injection can lead to password reset link poisoning.
- OAuth callback URL manipulation.
- Cache poisoning attacks.

**Recommendation:**

```typescript
trustHost: process.env.NODE_ENV === 'production'
  ? !!process.env.AUTH_TRUST_HOST  // Only trust if explicitly configured in production
  : true, // OK for development
```

Or better: set `NEXTAUTH_URL` / `AUTH_URL` explicitly in production and avoid relying on `trustHost`.

**Status:** 🔴 Open

---

#### AUTH-10 — Non-Null Assertion on OAuth Email (`user.email!`)

| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-476](https://cwe.mitre.org/data/definitions/476.html) — NULL Pointer Dereference |
| **OWASP** | A04:2021 — Insecure Design |
| **Category** | TypeScript / Reliability |
| **Location** | [auth.ts:42](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L42), [auth.ts:116](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L116) |
| **Likelihood** | Low |
| **Risk Score** | 4/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 30 minutes |

**Description:**

The `user.email!` non-null assertion is used in critical database operations. Some OAuth providers may not return an email (e.g., Apple can allow users to hide their email, GitHub users may have private email).

```typescript
// auth.ts:42
where: eq(users.email, user.email!),  // Could be null/undefined

// auth.ts:116
email: user.email!,  // Could be null/undefined
```

**Recommendation:**

```typescript
if (!user.email) {
  console.error("[OAuth] Provider did not return email address");
  return "/auth/error?error=EmailRequired";
}
```

**Status:** 🔴 Open

---

#### AUTH-11 — Unsafe `any` Type Usage

| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | N/A |
| **OWASP** | N/A |
| **Category** | TypeScript / Code Quality |
| **Location** | [auth.ts:39](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L39), [auth.ts:43](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L43) |
| **Likelihood** | N/A |
| **Risk Score** | 3/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 30 minutes |

**Description:**

```typescript
let existingUser: any = null;       // Line 39
}) as any;                           // Line 43
```

Using `any` disables TypeScript's type safety, which can hide bugs — especially dangerous in authentication code where a wrong property name could skip a security check.

**Recommendation:**

Define a proper type or use the inferred type from Drizzle:

```typescript
type UserRecord = typeof users.$inferSelect;
let existingUser: UserRecord | null = null;
```

**Status:** 🔴 Open

---

#### AUTH-12 — Debug Mode Enabled in Development Leaks Sensitive Data

| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-215](https://cwe.mitre.org/data/definitions/215.html) — Insertion of Sensitive Information Into Debugging Code |
| **OWASP** | A09:2021 — Security Logging and Monitoring Failures |
| **Category** | Security / Logging |
| **Location** | [auth.ts:23](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L23) |
| **Likelihood** | Low |
| **Risk Score** | 3/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 15 minutes |

**Description:**

```typescript
debug: process.env.NODE_ENV === 'development',
```

While this is correctly conditional on development mode, NextAuth debug mode logs full JWT tokens, session data, and callback parameters to the console. If logs are shipped to a centralized logging service (which is common), this creates a token/credential leak vector even in development.

**Recommendation:**

Use a dedicated `DEBUG_AUTH` environment variable:

```typescript
debug: process.env.DEBUG_AUTH === 'true',
```

**Status:** 🔴 Open

---

#### AUTH-13 — Email Logged in Suspension Check (PII in Logs)

| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-532](https://cwe.mitre.org/data/definitions/532.html) — Insertion of Sensitive Information into Log File |
| **OWASP** | A09:2021 — Security Logging and Monitoring Failures |
| **Category** | Security / Logging |
| **Location** | [auth.ts:52](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L52), [auth.config.ts:97](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L97) |
| **Likelihood** | Medium |
| **Risk Score** | 3/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 30 minutes |

**Description:**

User email addresses are logged directly:

```typescript
console.log(`[OAuth] Blocked login for suspended user: ${existingUser.email}`);  // auth.ts:52
console.log(`Account locked for user: ${email}`);  // auth.config.ts:97
```

**Recommendation:**

Use hashed/masked identifiers instead of raw PII:

```typescript
console.log(`[OAuth] Blocked login for suspended user: ${existingUser.id}`);
console.log(`Account locked for user ID: ${user.id}`);
```

**Status:** 🔴 Open

---

#### AUTH-14 — GPS Location from Untrusted Client Cookie

| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-807](https://cwe.mitre.org/data/definitions/807.html) — Reliance on Untrusted Inputs in a Security Decision |
| **OWASP** | A04:2021 — Insecure Design |
| **Category** | Security / Input Validation |
| **Location** | [auth.ts:230-234](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L230-L234) |
| **Likelihood** | Medium |
| **Risk Score** | 4/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 30 minutes |

**Description:**

Location data is read from a client-set cookie, decoded via `decodeURIComponent`, and stored in `loginHistory`:

```typescript
const gpsLocation = cookieStore.get("client-location")?.value;
if (gpsLocation) {
  location = decodeURIComponent(gpsLocation); // Client-controlled value
}
```

**Business Impact:**
- Stored XSS if location data is rendered without sanitization elsewhere.
- Misleading audit trail in login history.
- Potential SQL injection if the value is used in raw queries elsewhere (though Drizzle uses parameterized queries).

**Recommendation:**

Validate and sanitize the cookie value. Limit length, strip HTML/scripts, and use a regex to validate expected format:

```typescript
if (gpsLocation) {
  const decoded = decodeURIComponent(gpsLocation);
  // Validate format: "City, Country" or similar
  const sanitized = decoded.replace(/[<>'"&;]/g, '').substring(0, 200);
  if (/^[\w\s,.-]+$/.test(sanitized)) {
    location = sanitized;
  }
}
```

**Status:** 🔴 Open

---

#### AUTH-15 — Dynamic Imports in Hot Path Add Latency

| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | N/A |
| **OWASP** | N/A |
| **Category** | Performance |
| **Location** | [auth.ts:35-36](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L35-L36), [auth.ts:218-224](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L218-L224), [auth.ts:239-240](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L239-L240) |
| **Likelihood** | High |
| **Risk Score** | 3/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 1 hour |

**Description:**

The `signIn` and `jwt` callbacks use **9+ dynamic `import()` calls** within the request path. While these are cached after the first call by Node.js, they still add overhead on cold starts and make the code harder to trace:

```typescript
const { users } = await import("@/server/db/schema");           // Line 35
const { eq } = await import("drizzle-orm");                     // Line 36
const { headers } = await import("next/headers");                // Line 218
const { parseUserAgent } = await import("@/lib/utils/device");   // Line 223
const { getLocationFromIP } = await import("@/lib/utils/location"); // Line 224
const { cookies } = await import("next/headers");                // Line 228
const { loginHistory, userPreferences, users } = await import("@/server/db/schema"); // Line 239
const { eq, and } = await import("drizzle-orm");                 // Line 240
const { emailService } = await import("@/server/services/email"); // Line 278
const { RBACService } = await import("@/lib/rbac");              // Line 321
```

**Recommendation:**

Move imports to the top of the file. These are all server-side modules that won't affect client bundle size:

```typescript
import { users, loginHistory, userPreferences, accounts } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { headers, cookies } from "next/headers";
import { parseUserAgent } from "@/lib/utils/device";
import { getLocationFromIP } from "@/lib/utils/location";
import { emailService } from "@/server/services/email";
import { RBACService } from "@/lib/rbac";
```

**Status:** 🔴 Open

---

#### AUTH-16 — `new Date().toISOString()` vs Native Database Timestamps

| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | N/A |
| **OWASP** | N/A |
| **Category** | Database / Reliability |
| **Location** | [auth.ts:63-64](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L63-L64), [auth.ts:121-123](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L121-L123) |
| **Likelihood** | Low |
| **Risk Score** | 2/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 1 hour |

**Description:**

Timestamps are generated in application code using `new Date().toISOString()` instead of using database `DEFAULT NOW()` or `sql\`NOW()\``:

```typescript
lastLoginAt: new Date().toISOString(),
updatedAt: new Date().toISOString(),
createdAt: new Date().toISOString(),
```

**Business Impact:**
- Clock skew between application servers and the database can cause inconsistent timestamps.
- Multiple `new Date()` calls in the same function can produce slightly different timestamps.
- ISO strings stored as text lose timezone context and database timestamp indexing capabilities.

**Recommendation:** Use `sql\`NOW()\`` or database-level defaults for timestamp columns.

**Status:** 🔴 Open

---

#### AUTH-17 — Secret Fallback Chain in auth.config.ts

| Field | Value |
|---|---|
| **Severity** | 🔵 **LOW** |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **Category** | Security / Configuration |
| **Location** | [auth.config.ts:155](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L155) |
| **Likelihood** | Low |
| **Risk Score** | 2/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 15 minutes |

**Description:**

```typescript
secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
```

Having two different secret variables (`NEXTAUTH_SECRET` and `AUTH_SECRET`) with fallback is confusing and could lead to misconfiguration where one is set but not the other. The `env.example` shows both should be the same value.

**Recommendation:** Standardize on `AUTH_SECRET` (the Auth.js v5 convention) and remove `NEXTAUTH_SECRET`.

**Status:** 🔴 Open

---

#### AUTH-18 — Cookie Name Missing `__Host-` Prefix

| Field | Value |
|---|---|
| **Severity** | 🔵 **LOW** |
| **CWE** | [CWE-614](https://cwe.mitre.org/data/definitions/614.html) — Sensitive Cookie in HTTPS Session Without 'Secure' Attribute |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **Category** | Security / Cookies |
| **Location** | [auth.config.ts:157-174](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L157-L174) |
| **Likelihood** | Low |
| **Risk Score** | 2/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 30 minutes |

**Description:**

Session and CSRF cookies use a custom name `next-auth.session-token` but don't use the `__Host-` prefix, which provides additional browser-level protections (enforces `Secure`, `Path=/`, no `Domain` attribute).

**Recommendation (production):**

```typescript
sessionToken: {
  name: process.env.NODE_ENV === 'production'
    ? `__Host-next-auth.session-token`
    : `next-auth.session-token`,
  options: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  }
},
```

**Status:** 🔴 Open

---

#### AUTH-19 — `reactStrictMode: false` in Next.js Config

| Field | Value |
|---|---|
| **Severity** | 🔵 **LOW** |
| **CWE** | N/A |
| **OWASP** | N/A |
| **Category** | Code Quality / Next.js |
| **Location** | [next.config.ts:32](file:///d:/Pratik/Dev/Projects/AuthPay/next.config.ts#L32) |
| **Likelihood** | N/A |
| **Risk Score** | 1/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 15 minutes |

**Description:**

React Strict Mode is explicitly disabled. This prevents double-rendering checks in development that catch common bugs like missing cleanup in `useEffect`, impure render functions, and deprecated API usage.

**Recommendation:** Enable `reactStrictMode: true` and fix any double-render issues that surface.

**Status:** 🔴 Open

---

#### AUTH-20 — CSP Allows `unsafe-eval` and `unsafe-inline`

| Field | Value |
|---|---|
| **Severity** | 🔵 **LOW** |
| **CWE** | [CWE-79](https://cwe.mitre.org/data/definitions/79.html) |
| **OWASP** | A03:2021 — Injection |
| **Category** | Security / Headers |
| **Location** | [next.config.ts:26](file:///d:/Pratik/Dev/Projects/AuthPay/next.config.ts#L26) |
| **Likelihood** | Low |
| **Risk Score** | 3/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 4 hours |

**Description:**

The Content-Security-Policy header includes `'unsafe-eval'` and `'unsafe-inline'`:

```
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
```

This significantly weakens XSS protection — `unsafe-eval` allows `eval()` calls (commonly used in XSS payloads), and `unsafe-inline` allows inline script tags.

**Recommendation:** Use nonce-based CSP:

```typescript
// In middleware, generate a nonce per request
const nonce = crypto.randomUUID();
const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: https:; font-src 'self' data:;`;
```

Note: This requires adding `nonce` to all `<script>` tags in your layout. Next.js has experimental support for this via `next.config.ts` `experimental.sri`.

**Status:** 🔴 Open

---

#### AUTH-21 — Session Callback Returns Empty Object on Expiry

| Field | Value |
|---|---|
| **Severity** | ⚪ **INFORMATIONAL** |
| **CWE** | N/A |
| **OWASP** | N/A |
| **Category** | Code Quality |
| **Location** | [auth.ts:179-181](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.ts#L179-L181) |

**Description:**

```typescript
if (token.error === "SessionExpired") {
  return {} as Session;  // Unsafe type assertion
}
```

Returning `{} as Session` breaks the type contract — consumers expecting `session.user` will throw. Consider returning `null` or a session with explicit `user: null`.

**Status:** 🔴 Open

---

#### AUTH-22 — `img-src` in CSP Allows All HTTPS Origins

| Field | Value |
|---|---|
| **Severity** | ⚪ **INFORMATIONAL** |
| **CWE** | N/A |
| **OWASP** | N/A |
| **Category** | Security / Headers |
| **Location** | [next.config.ts:26](file:///d:/Pratik/Dev/Projects/AuthPay/next.config.ts#L26) |

**Description:** `img-src 'self' data: https:` allows loading images from any HTTPS origin. This is common but could be tightened to specific domains (OAuth provider avatars, CDN).

**Status:** 🔴 Open

---

#### AUTH-23 — Missing HSTS `preload` Directive

| Field | Value |
|---|---|
| **Severity** | ⚪ **INFORMATIONAL** |
| **CWE** | N/A |
| **OWASP** | N/A |
| **Category** | Security / Headers |
| **Location** | [next.config.ts:10](file:///d:/Pratik/Dev/Projects/AuthPay/next.config.ts#L10) |

**Description:**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Missing the `preload` directive. Add `; preload` and submit to the HSTS preload list for maximum protection against downgrade attacks.

**Status:** 🔴 Open

---

#### AUTH-24 — Missing `Permissions-Policy` Header

| Field | Value |
|---|---|
| **Severity** | ⚪ **INFORMATIONAL** |
| **CWE** | N/A |
| **OWASP** | N/A |
| **Category** | Security / Headers |
| **Location** | [next.config.ts](file:///d:/Pratik/Dev/Projects/AuthPay/next.config.ts) |

**Description:** No `Permissions-Policy` (formerly `Feature-Policy`) header is set. This header restricts access to browser features (camera, microphone, geolocation, etc.).

**Recommendation:**

```typescript
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=(), payment=(self)'
}
```

**Status:** 🔴 Open

---

### Positive Security Observations

1. ✅ **JWT strategy** — Using JWT (`strategy: "jwt"`) is appropriate for this application's architecture and avoids server-side session storage complexity.
2. ✅ **Session expiry** — 24-hour `maxAge` is reasonable for a consumer-facing app.
3. ✅ **Custom login pages** — Using custom pages (`/auth/login`, `/auth/error`) instead of default NextAuth pages is correct.
4. ✅ **Cookie configuration** — `httpOnly: true`, `sameSite: 'lax'`, conditional `secure` flag are all good baseline settings.
5. ✅ **Account lockout** — Locking accounts after 5 failed attempts with a 15-minute cooldown is a reasonable brute-force mitigation.
6. ✅ **Failed attempt tracking** — Incrementing and resetting failed login attempts is correctly implemented.
7. ✅ **Password change session invalidation** — Checking `passwordChangedAt` against `token.iat` to invalidate sessions after password change is excellent security.
8. ✅ **Security alert emails** — Sending login alert emails with device/location info is a strong security feature.
9. ✅ **New device detection** — Checking login history for new device/browser/OS combinations is a good security measure.
10. ✅ **`poweredByHeader: false`** — Disabling the `X-Powered-By` header reduces information disclosure.
11. ✅ **Security headers** — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy are all present.
12. ✅ **Rate limiting** — API routes use `rateLimiters.auth()` wrapper (seen in cross-referenced files).
13. ✅ **Suspension check** — OAuth sign-in correctly checks `isSuspended` before allowing login.
14. ✅ **OTP deletion after use** — Single-use enforcement for OTP codes is correctly implemented.

---

### Code Quality Review

| Aspect | Score | Notes |
|---|---|---|
| **Architecture** | 5/10 | Monolithic callbacks with too many responsibilities. The `jwt` callback does login tracking, email sending, role fetching, and session validation — these should be separate services. |
| **Maintainability** | 4/10 | 340-line file with deeply nested try/catch blocks. The `signIn` callback alone is 150 lines. Dynamic imports make control flow hard to trace. |
| **Performance** | 5/10 | 9+ dynamic imports on hot path. Multiple sequential DB queries in JWT callback (login history check, insert, preferences, user record, roles). No batching or parallel execution. |
| **Type Safety** | 4/10 | Multiple `any` casts, non-null assertions (`!`), and `as` type assertions undermine TypeScript's value. |
| **Error Handling** | 6/10 | Try/catch blocks are present but inconsistent. Some errors return redirects, some return `null`, some are silently swallowed. The `jwt` callback catches errors but continues with potentially stale token data. |
| **Logging** | 4/10 | Mix of `console.log` and `console.error` with PII (emails) in log messages. No structured logging. No correlation IDs. |
| **Documentation** | 3/10 | Minimal inline comments. No JSDoc on exported functions. The `skipPasswordCheck` mechanism lacks documentation of its security implications. |

---

### Risk Score (File 1: auth.ts)

| Category | Score (0-10) |
|---|---|
| **Security** | 3/10 |
| **Maintainability** | 4/10 |
| **Performance** | 5/10 |
| **Reliability** | 5/10 |
| **Overall** | 4/10 |

---

### Action Items (auth.ts + auth.config.ts)

- [ ] **[CRITICAL]** Remove `skipPasswordCheck` as client-controllable credential; replace with server-side signed token (AUTH-01)
- [ ] **[CRITICAL]** Remove all `'fallback-secret'` hardcoded values; fail hard on missing secrets (AUTH-02)
- [ ] **[CRITICAL]** Implement server-side 2FA enforcement; do not rely on client-side redirect (AUTH-03)
- [ ] **[CRITICAL]** Fix OAuth account linking to prevent account takeover (AUTH-04)
- [ ] **[HIGH]** Validate and parse IP addresses properly (AUTH-05)
- [ ] **[HIGH]** Add suspension check to JWT refresh; reduce refresh interval (AUTH-06)
- [ ] **[HIGH]** Encrypt OAuth tokens at rest (AUTH-07)
- [ ] **[HIGH]** Wrap OAuth user creation in database transaction (AUTH-08)
- [ ] **[HIGH]** Make `trustHost` conditional on environment (AUTH-09)
- [ ] **[MEDIUM]** Validate OAuth provider email presence before use (AUTH-10)
- [ ] **[MEDIUM]** Replace `any` types with proper Drizzle types (AUTH-11)
- [ ] **[MEDIUM]** Gate debug mode on explicit env var (AUTH-12)
- [ ] **[MEDIUM]** Remove PII from log messages (AUTH-13)
- [ ] **[MEDIUM]** Sanitize client-location cookie value (AUTH-14)
- [ ] **[MEDIUM]** Move dynamic imports to top-level (AUTH-15)
- [ ] **[MEDIUM]** Use database-level timestamps (AUTH-16)
- [ ] **[LOW]** Standardize on single AUTH_SECRET variable (AUTH-17)
- [ ] **[LOW]** Use `__Host-` cookie prefix in production (AUTH-18)
- [ ] **[LOW]** Enable `reactStrictMode` (AUTH-19)
- [ ] **[LOW]** Strengthen CSP by removing unsafe-eval/unsafe-inline (AUTH-20)
- [ ] **[INFO]** Fix empty session return type (AUTH-21)
- [ ] **[INFO]** Tighten `img-src` CSP directive (AUTH-22)
- [ ] **[INFO]** Add HSTS `preload` directive (AUTH-23)
- [ ] **[INFO]** Add `Permissions-Policy` header (AUTH-24)

---

## File 2: `src/config/auth.config.ts`

**Path:** [auth.config.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts)
**Lines:** 179 | **Size:** 6KB

### Overview

This file defines the NextAuth provider configuration, including 5 OAuth providers (GitHub, Google, Apple, Facebook, Azure AD) and a Credentials provider. It also configures cookie security settings and the application secret.

> **Note:** Most findings for this file are shared with `auth.ts` and documented above. This section covers findings unique to `auth.config.ts`.

---

### Findings

> Findings AUTH-01, AUTH-02, AUTH-03, AUTH-13, AUTH-17, AUTH-18 are shared with this file. See above for details.

---

#### AUTH-25 — 2FA Returns `null` (Indistinguishable from Invalid Credentials)

| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-204](https://cwe.mitre.org/data/definitions/204.html) — Observable Response Discrepancy |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Category** | Authentication |
| **Location** | [auth.config.ts:121-126](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L121-L126) |
| **Likelihood** | Medium |
| **Risk Score** | 4/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 2 hours |

**Description:**

When 2FA is enabled, `authorize()` returns `null`, which is the same return value as "invalid credentials." The client must make a separate API call to `validate-credentials` beforehand to know whether 2FA is required. This creates a fragile, multi-step client flow that is easy to bypass.

The comment at line 123-124 explicitly acknowledges this: *"Return null to indicate failed authentication (2FA required). The frontend will handle checking 2FA status and redirecting."*

**Recommendation:** Use a custom error with a specific code to signal 2FA requirement:

```typescript
if (has2FA) {
  throw new AuthError("2FA_REQUIRED", { cause: { email: user.email, method: twoFAMethod } });
}
```

Then handle this in the `signIn` callback or a custom error page.

**Status:** 🔴 Open

---

#### AUTH-26 — Session Record Has Placeholder Data

| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-778](https://cwe.mitre.org/data/definitions/778.html) — Insufficient Logging |
| **OWASP** | A09:2021 — Security Logging and Monitoring Failures |
| **Category** | Security / Logging |
| **Location** | [auth.config.ts:131-135](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L131-L135) |
| **Likelihood** | High |
| **Risk Score** | 4/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 30 minutes |

**Description:**

Session creation uses hardcoded placeholder values:

```typescript
await SessionService.createSession({
  userId: user.id,
  userAgent: "NextAuth Session",  // Hardcoded string
  ipAddress: undefined,           // No IP captured
});
```

This renders session tracking useless for security auditing. The comments even acknowledge this: *"You could pass actual user agent here"* and *"You could pass actual IP here"*.

**Recommendation:**

Access headers in the `authorize` callback:

```typescript
// Note: In NextAuth v5 Credentials provider, you can access the request
// via the `request` parameter in the authorize function
const headersList = await headers();
await SessionService.createSession({
  userId: user.id,
  userAgent: headersList.get('user-agent') || 'unknown',
  ipAddress: headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
});
```

**Status:** 🔴 Open

---

#### AUTH-27 — Error Swallowed in Credentials Authorize

| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-755](https://cwe.mitre.org/data/definitions/755.html) — Improper Handling of Exceptional Conditions |
| **OWASP** | A09:2021 — Security Logging and Monitoring Failures |
| **Category** | Reliability / Error Handling |
| **Location** | [auth.config.ts:147-150](file:///d:/Pratik/Dev/Projects/AuthPay/src/config/auth.config.ts#L147-L150) |
| **Likelihood** | Medium |
| **Risk Score** | 3/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 15 minutes |

**Description:**

The outer catch block in `authorize` catches ALL errors and returns `null`:

```typescript
} catch (error) {
  console.error("Authentication error:", error);
  return null;  // Hides critical errors like DB connection failures
}
```

This means a database outage looks identical to "invalid credentials" to the user. The account lockout `throw new Error(...)` at line 72 is also caught here and converted to `null`.

**Recommendation:** Re-throw known errors and only catch unexpected ones:

```typescript
} catch (error) {
  if (error instanceof Error && error.message.includes("locked")) {
    throw error; // Let NextAuth handle this as a sign-in error
  }
  console.error("Unexpected authentication error:", error);
  throw new Error("Authentication service unavailable");
}
```

**Status:** 🔴 Open

---

### Positive Security Observations (auth.config.ts)

1. ✅ **bcrypt password hashing** — Using `bcryptjs` for password comparison is correct.
2. ✅ **Account lockout mechanism** — 5-attempt lockout with 15-minute cooldown.
3. ✅ **Failed attempt reset** — Correctly resets counter on successful login.
4. ✅ **Cookie security** — `httpOnly`, `sameSite: 'lax'`, conditional `secure`.
5. ✅ **Null user check** — Early return for non-existent users.
6. ✅ **No password, no login** — Users without passwords are rejected unless `skipPasswordCheck` is set.

---

### Code Quality Review (auth.config.ts)

| Aspect | Score | Notes |
|---|---|---|
| **Architecture** | 5/10 | Single `authorize` function handling validation, lockout, 2FA detection, and session creation — too many concerns. |
| **Maintainability** | 6/10 | Relatively straightforward but the `skipPasswordCheck` mechanism adds dangerous complexity. |
| **Performance** | 7/10 | Appropriate use of early returns. `bcrypt.compare` is intentionally slow (security feature). |
| **Type Safety** | 5/10 | Input credentials are cast with `as string` without validation. `skipPasswordCheck` is stringly-typed. |
| **Error Handling** | 4/10 | Outer catch swallows all errors including lockout throws. Session creation failure is silently ignored. |
| **Logging** | 4/10 | PII in logs. No structured logging. Session failure logged but not surfaced. |

---

### Risk Score (File 2: auth.config.ts)

| Category | Score (0-10) |
|---|---|
| **Security** | 3/10 |
| **Maintainability** | 5/10 |
| **Performance** | 7/10 |
| **Reliability** | 5/10 |
| **Overall** | 1/10 |

---

## File 14: `src/lib/auth/session-validation.ts`

**Path:** [session-validation.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/auth/session-validation.ts)
**Lines:** 258 | **Size:** 7KB

### Overview
A custom session validation utility designed to wrap API routes and middleware, fetching user data and verifying session validity.

---

### Findings

#### SES-01 — Auth.js Strategy Mismatch (Complete API Breakage)
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **Category** | Authentication |
| **Location** | [session-validation.ts:48-58, 157-159](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/auth/session-validation.ts#L48-L58) |
| **Risk Score** | 10/10 |

**Description:**
This file extracts the `next-auth.session-token` cookie and attempts to validate it against the database using `SessionService.validateSession(sessionToken)`. However, based on earlier reviews (`auth.config.ts`), this application uses **JWT** strategies for Auth.js. 
When NextAuth uses JWTs, the `next-auth.session-token` cookie contains an encrypted JSON Web Token, *not* a random database string. Querying the database for this JWT string will always return `null`. As a result, this validation wrapper will permanently reject all authenticated requests, completely breaking the API.

**Recommendation:**
Do not write custom session validation logic that duplicates Auth.js. Use the official `auth()` wrapper from `auth.ts` to decode the JWT and extract the session securely.

#### SES-02 — Missing CSRF Validation for API Routes
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-352](https://cwe.mitre.org/data/definitions/352.html) — Cross-Site Request Forgery (CSRF) |
| **Category** | Request Protection |
| **Location** | [session-validation.ts:227-242](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/auth/session-validation.ts#L227-L242) |
| **Risk Score** | 9/10 |

**Description:**
The `withSessionValidation` helper is intended to wrap API routes. It validates the user's session (often extracted from cookies) but **fails to validate a CSRF token** for state-changing requests (`POST`, `PUT`, `DELETE`). If a victim is tricked into clicking a malicious link or visiting a malicious site, the browser will automatically send the `session-token` cookie to this API, and this middleware will authorize the request.

**Recommendation:**
If using cookie-based authentication for APIs, you must enforce CSRF protection by requiring and validating the `x-csrf-token` header against the `next-auth.csrf-token` cookie, or enforce strict CORS + SameSite cookie policies. (NextAuth handles this automatically, which is another reason to use `auth()` instead of a custom wrapper).

#### SES-03 — Database Exhaustion (N+1 Query in Middleware)
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-400](https://cwe.mitre.org/data/definitions/400.html) — Uncontrolled Resource Consumption |
| **Category** | Scalability |
| **Location** | [session-validation.ts:68-77](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/auth/session-validation.ts#L68-L77) |
| **Risk Score** | 8/10 |

**Description:**
`validateSessionFromRequest` executes `db.query.users.findFirst(...)` synchronously on every single authenticated request. There is no caching. At 10,000 concurrent users making 1 request per second, this generates 10,000 database queries per second purely for authorization. This will instantly exhaust the PostgreSQL connection pool (especially in Edge/Serverless runtimes) and bring down the database.

**Recommendation:**
Embed necessary user claims (`isActive`, `isEmailVerified`, `roles`) directly into the JWT payload during session creation (`jwt` callback in Auth.js). This eliminates the need to query the database on every request.

#### SES-04 — Header Spoofing Precedence
| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **Category** | Authentication |
| **Location** | [session-validation.ts:150-154](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/auth/session-validation.ts#L150-L154) |
| **Risk Score** | 6/10 |

**Description:**
`extractSessionToken` checks for the custom `x-session-token` header *before* checking the secure `__Secure-next-auth.session-token` cookie. If an edge proxy or CDN does not strip `x-session-token` from incoming requests, an attacker could potentially spoof a session or bypass cookie restrictions by injecting this header.

**Recommendation:**
Prioritize extracting tokens from expected, secure sources (Bearer tokens or secure cookies). If `x-session-token` is required for legacy clients, validate it securely, but do not prioritize it over HttpOnly cookies.

#### SES-05 — Incomplete Cookie Clearing
| Field | Value |
|---|---|
| **Severity** | 🔵 **LOW** |
| **Category** | Security |
| **Location** | [session-validation.ts:213-221](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/auth/session-validation.ts#L213-L221) |
| **Risk Score** | 3/10 |

**Description:**
`clearSessionCookies` forcefully sets the cookie path to `/` and omits the `domain` attribute. If the application is deployed across subdomains (e.g., `app.authpay.com` and `authpay.com`) and cookies were set with `domain: '.authpay.com'`, this function will fail to clear the cookie in the user's browser, leaving them logged in on the client side.

**Recommendation:**
Ensure cookie clearing logic matches the exact domain and path configurations used during cookie creation.

---

### File Scores (`src/lib/auth/session-validation.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 3/10 |
| **Authentication** | 2/10 |
| **Performance** | 3/10 |
| **Reliability** | 4/10 |
| **Scalability** | 2/10 |
| **Maintainability** | 5/10 |
| **Overall** | 3/10 |

---

## File 15: `src/lib/rbac/policy-middleware.ts`

**Path:** [policy-middleware.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/policy-middleware.ts)
**Lines:** 298 | **Size:** 7KB

### Overview
Provides policy-enforcement wrappers (`requirePolicy`, `requireAdmin`, etc.) designed for securing Next.js API Routes and Server Actions using JWT tokens.

---

### Findings

#### AUTH-05 — Missing CSRF Protection in API Route Wrapper
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-352](https://cwe.mitre.org/data/definitions/352.html) — Cross-Site Request Forgery (CSRF) |
| **Category** | Request Protection |
| **Location** | [policy-middleware.ts:42-45](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/policy-middleware.ts#L42-L45) |
| **Risk Score** | 9/10 |

**Description:**
The middleware explicitly uses `getToken({ req })` to extract and decode the JWT session token, and immediately trusts it to authorize the request. However, `getToken()` only validates the JWT; it **does not validate CSRF tokens**. If this function is used to protect state-changing POST/PUT/DELETE API endpoints, an attacker can trivially exploit CSRF by having a victim's browser automatically send the JWT cookie to the vulnerable endpoint.

**Recommendation:**
Instead of manually calling `getToken()` in a custom wrapper, utilize NextAuth's official `auth()` middleware. It inherently enforces CSRF protection for all state-changing API routes. If you must use `getToken()`, you are responsible for manually validating the `next-auth.csrf-token` against an `x-csrf-token` header.

#### AUTH-06 — Inconsistent Authentication Strategy Integration
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **Category** | Architecture |
| **Location** | [policy-middleware.ts:44](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/policy-middleware.ts#L44) |
| **Risk Score** | 7/10 |

**Description:**
This file correctly attempts to read the JWT via `getToken()`, which contradicts the previous `session-validation.ts` that wrongly assumed database sessions were in use. However, it hardcodes the secret to `process.env.NEXTAUTH_SECRET`. If the application migrated to `AUTH_SECRET` (as standard in Auth.js v5), this `getToken` call will silently fail, returning `null` and locking out all authenticated users.

**Recommendation:**
Consolidate all authentication into the official `auth()` wrapper.

---

### File Scores (`src/lib/rbac/policy-middleware.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 3/10 |
| **Authorization** | 7/10 |
| **Performance** | 5/10 |
| **Overall** | 4/10 |

---

## File 16: `src/lib/rbac/routing-utils.ts`

**Path:** [routing-utils.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/routing-utils.ts)
**Lines:** 281 | **Size:** 7KB

### Overview
A centralized configuration object (`ROUTE_POLICIES`) and server-side utilities to authorize requested URL paths against RBAC policies.

---

### Findings

#### AUTH-07 — Default-Allow Routing (Fail-Open Authorization Bypass)
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-276](https://cwe.mitre.org/data/definitions/276.html) — Incorrect Default Permissions |
| **Category** | Routing Security |
| **Location** | [routing-utils.ts:163-170](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/routing-utils.ts#L163-L170) |
| **Risk Score** | 10/10 |

**Description:**
The `getAuthorizedRoute` function searches `ROUTE_POLICIES` for a matching path. If a match is not found (`!routeConfig`), the function immediately returns `{ allowed: true }`. 
This is a **Default-Allow** design. If a developer creates a new sensitive route (e.g., `/protected/admin/billing-export`) but forgets to map it inside `ROUTE_POLICIES`, the application will default to granting access to *anyone*, completely bypassing the RBAC system. 

**Recommendation:**
Authorization systems must always **Fail-Closed**. 
If a route starts with `/protected/` (or any sensitive prefix) and is not explicitly mapped in `ROUTE_POLICIES`, the system must return `{ allowed: false }` or throw an error. 

#### AUTH-08 — Path Overlap Vulnerability (`startsWith` Matching)
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-706](https://cwe.mitre.org/data/definitions/706.html) — Use of Incorrectly-Resolved Name or Reference |
| **Category** | Routing Security |
| **Location** | [routing-utils.ts:164](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/routing-utils.ts#L164) |
| **Risk Score** | 7/10 |

**Description:**
The router matches paths using `.startsWith(config.path)`. While this allows nesting (e.g., `/protected/admin/users/edit`), it also introduces path overlap vulnerabilities. For example, a route like `/protected/admin/users-export-logs` (which might require a `system:audit` policy) would match the `ADMIN_USERS` (`/protected/admin/users`) configuration because it *starts with* that string, inheriting the weaker `user:manage` policy.

**Recommendation:**
Use exact matching for exact routes, or enforce a trailing slash boundary for prefix matching. A robust solution uses path-to-regexp or Next.js `URLPattern` matching instead of string `startsWith`.

#### AUTH-09 — Weak Open Redirect Validation
| Field | Value |
|---|---|
| **Severity** | 🔵 **LOW** |
| **Category** | Security |
| **Location** | [routing-utils.ts:204](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/routing-utils.ts#L204) |
| **Risk Score** | 3/10 |

**Description:**
`getPostLoginRedirect` validates the `returnTo` parameter using `returnTo.startsWith('/protected')`. This allows payloads like `returnTo=/protected.attacker.com`, which technically is a valid relative path, but relies heavily on the Next.js router strictly interpreting it as relative. A more robust check is needed.

**Recommendation:**
Use standard relative path validation: `returnTo.startsWith('/') && !returnTo.startsWith('//')`.

---

### Positive Security Observations
1. ✅ **Centralized Policy Mapping**: Abstracting route authorization into a single `ROUTE_POLICIES` configuration object is an excellent architectural choice that prevents scattered, inconsistent checks across layouts.

---

### File Scores (`src/lib/rbac/routing-utils.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 3/10 |
| **Routing Security** | 2/10 |
| **Maintainability** | 8/10 |
| **Overall** | 4/10 |

---

## File 3: `src/server/services/auth.ts`

**Path:** [auth.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/auth.ts)
**Lines:** 535 | **Size:** 18KB

### Overview

This file contains the core business logic for user registration, email verification, and password resets. It directly manipulates the `users` and `otpCodes` database tables.

---

### Findings

#### AUTH-28 — Predictable OTP Generation via `Math.random()`
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-338](https://cwe.mitre.org/data/definitions/338.html) — PRNG |
| **OWASP** | A02:2021 — Cryptographic Failures |
| **Category** | Cryptography / Authentication |
| **Location** | [auth.ts:512-514](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/auth.ts#L512-L514) |
| **Risk Score** | 9/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 15 mins |

**Description:**
The `generateVerificationCode` function uses `Math.random()` to generate the 6-digit OTP code for both email verification and password resets. `Math.random()` is not cryptographically secure and its outputs can be predicted.

**Business Impact:**
An attacker can predict the password reset OTP codes generated for other users, leading to complete account takeover.

**Recommendation:**
Use the Node.js `crypto` module to generate secure random numbers:
```typescript
import { randomInt } from 'crypto';
private static generateVerificationCode(): string {
  return randomInt(100000, 1000000).toString();
}
```

#### AUTH-29 — Dead Code / Unusable Secure Password Reset Flow
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-561](https://cwe.mitre.org/data/definitions/561.html) — Dead Code |
| **OWASP** | A04:2021 — Insecure Design |
| **Category** | Authentication / Architecture |
| **Location** | [auth.ts:423-506](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/auth.ts#L423-L506) |
| **Risk Score** | 7/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 3 hours |

**Description:**
The application has two password reset functions: `resetPassword` (which uses a simple 6-digit code) and `resetPasswordWithVerifiedToken` (which is designed for a secure, token-based multi-step flow). However, `verifiedToken` is never generated or set anywhere in the codebase. As a result, the secure flow is unusable, and the application falls back to the less secure `resetPassword` function, which is vulnerable to brute-force attacks on the 6-digit code.

**Business Impact:**
The intended secure architecture is bypassed entirely, leaving password resets vulnerable to brute force and interception.

**Recommendation:**
Update `verifyPasswordResetCode` to generate a `verifiedToken`, save it to the DB, and return it to the client. The client should then call `resetPasswordWithVerifiedToken`. Delete the insecure `resetPassword` function entirely.

#### AUTH-30 — Non-Atomic User Registration
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-362](https://cwe.mitre.org/data/definitions/362.html) — Race Condition / Atomicity |
| **OWASP** | A04:2021 — Insecure Design |
| **Category** | Database / Reliability |
| **Location** | [auth.ts:63-90](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/auth.ts#L63-L90) |
| **Risk Score** | 6/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 1 hour |

**Description:**
The `registerUser` function performs multiple inserts (user, role, OTP code) without a database transaction. If the role or OTP insertion fails, the user is left in an inconsistent state (created but without a role or verification code).

**Business Impact:**
Partial failures lead to "zombie" accounts that can't log in or verify their email.

**Recommendation:**
Wrap the entire registration flow inside a `db.transaction(async (tx) => { ... })`.

#### AUTH-31 — Missing Rate Limiting / Brute-Force Protection on OTPs
| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-307](https://cwe.mitre.org/data/definitions/307.html) |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Category** | Authentication |
| **Location** | [auth.ts:113](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/auth.ts#L113), [auth.ts:316](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/auth.ts#L316) |
| **Risk Score** | 5/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 2 hours |

**Description:**
`verifyEmail` and `verifyPasswordResetCode` do not enforce a maximum number of incorrect attempts (e.g., locking out the code after 3 failures). This allows an attacker to brute-force the 6-digit code if they bypass external API rate limiters.

**Recommendation:**
Add a `failedAttempts` column to `otpCodes` and invalidate the code if it exceeds 3-5 attempts.

---

### File Scores (`src/server/services/auth.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 2/10 |
| **Maintainability** | 6/10 |
| **Performance** | 7/10 |
| **Reliability** | 4/10 |
| **Overall** | 4/10 |

---

## File 4: `src/server/services/session.ts`

**Path:** [session.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/session.ts)
**Lines:** 669 | **Size:** 20KB

### Overview
Handles database-backed session storage, tracking active devices, session extensions, and security alert triggers.

---

### Findings

#### AUTH-32 — Session Invalidation Relies on Expiry Timestamp Mutation
| Field | Value |
|---|---|
| **Severity** | 🔵 **LOW** |
| **CWE** | N/A |
| **OWASP** | A04:2021 — Insecure Design |
| **Category** | Architecture |
| **Location** | [session.ts:437-481](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/session.ts#L437-L481) |
| **Risk Score** | 2/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 1 hour |

**Description:**
The `invalidateSession` functions mark a session as invalid by setting `expiresAt = new Date()`. This relies strictly on server time sync and doesn't explicitly revoke the session. If the server clock drifts backwards slightly, the session could briefly become valid again.

**Recommendation:**
Use a boolean `isRevoked` column or delete the session record entirely instead of mutating `expiresAt`.

---

### Positive Security Observations (session.ts)
1. ✅ **Cryptographically Secure Tokens** — Uses `nanoid(32)` for session tokens.
2. ✅ **Transactional Creation** — `createSession` correctly wraps user and session updates in a `db.transaction`.
3. ✅ **Session Limits** — Caps concurrent sessions at 5 per user (`limitUserSessions`).

---

### File Scores (`src/server/services/session.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 8/10 |
| **Maintainability** | 8/10 |
| **Performance** | 8/10 |
| **Reliability** | 9/10 |
| **Overall** | 8/10 |

---

## File 5: `src/server/services/totp.ts`

**Path:** [totp.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/totp.ts)
**Lines:** 140 | **Size:** 4KB

### Overview
Manages TOTP secret generation, token verification, and backup recovery codes.

---

### Findings

#### AUTH-33 — TOTP Window Size Creates Extended Validity
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-613](https://cwe.mitre.org/data/definitions/613.html) |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Category** | Authentication / 2FA |
| **Location** | [totp.ts:28-29](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/totp.ts#L28-L29) |
| **Risk Score** | 6/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 2 hours |

**Description:**
The configuration specifies `window: 1`. This allows the previous, current, and next 30-second window to be valid. However, since tokens are not explicitly tracked as "used", an attacker who intercepts a token could reuse it within that 90-second window (Replay Attack).

**Recommendation:**
TOTP tokens must be single-use. Add a tracking mechanism (e.g., storing the last used timestamp/step in the database) to prevent a token from being used more than once.

#### AUTH-34 — Recovery Code Hashing Strategy
| Field | Value |
|---|---|
| **Severity** | 🔵 **LOW** |
| **Category** | Cryptography |
| **Location** | [totp.ts:112](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/services/totp.ts#L112) |
| **Risk Score** | 2/10 |
| **Fix Difficulty** | Easy |
| **Estimated Time** | 30 mins |

**Description:**
Recovery codes are hashed with bcrypt (cost 10). Because recovery codes are short, low-entropy alphanumeric strings (8 characters), bcrypt is somewhat vulnerable to offline cracking if the database is leaked.

**Recommendation:**
This is mostly mitigated by rate limiting the recovery endpoints. However, a stronger pepper or using SHA-256 for rapid lookup (since they are securely random) might be preferable depending on the exact threat model. Using bcrypt is still generally acceptable here.

---

### Positive Security Observations (totp.ts)
1. ✅ **Cryptographically Secure PRNG** — Uses `crypto.randomBytes` for recovery codes.
2. ✅ **Secure Secrets** — `OTPAuth.Secret` generates secure 160-bit secrets.
3. ✅ **Encryption at Rest** — TOTP secrets are encrypted before storage.

---

### File Scores (`src/server/services/totp.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 7/10 |
| **Maintainability** | 9/10 |
| **Performance** | 8/10 |
| **Reliability** | 8/10 |
| **Overall** | 8/10 |

---

## File 6: `src/lib/payments/providers/razorpay.ts`

**Path:** [razorpay.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/payments/providers/razorpay.ts)
**Lines:** 119 | **Size:** 4KB

### Overview
Integrates Razorpay for creating orders, verifying frontend payment signatures, and issuing refunds.

---

### Findings

#### PAY-01 — Missing Webhook Signature Verification Method
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) — Improper Verification of Cryptographic Signature |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Category** | Security / Webhooks |
| **Location** | [razorpay.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/payments/providers/razorpay.ts) |
| **Risk Score** | 7/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 1 hour |

**Description:**
The provider implements `verifyPayment` (used for client-side success callbacks) but lacks a `verifyWebhookSignature` method. Razorpay webhooks send an `x-razorpay-signature` header which must be verified using a dedicated Webhook Secret (which is different from the API Secret). Without this implemented in the provider, webhook validation might be skipped or duplicated inconsistently.

**Business Impact:**
If webhooks are processed without signature validation elsewhere, an attacker can forge "payment success" webhooks to activate subscriptions without paying.

**Recommendation:**
Add a `verifyWebhookSignature(payload, signature, secret)` method that uses `crypto.createHmac('sha256', secret).update(payload).digest('hex')` and safely compares it to the incoming signature.

#### PAY-02 — Missing Idempotency Keys on External API Calls
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-362](https://cwe.mitre.org/data/definitions/362.html) — Race Condition |
| **OWASP** | A04:2021 — Insecure Design |
| **Category** | Reliability / Financial Integrity |
| **Location** | [razorpay.ts:92-114](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/payments/providers/razorpay.ts#L92-L114) |
| **Risk Score** | 7/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 2 hours |

**Description:**
The `createRefund` method does not supply an explicit idempotency key. If a network timeout occurs while calling the Razorpay API and the application retries the request, Razorpay will process it as a brand new refund, resulting in a double-refund for the customer.

**Business Impact:**
Direct financial loss through duplicate refunds (or duplicate orders if `createOrder` is retried).

**Recommendation:**
Pass an idempotency key (derived from `input.receipt` or a unique refund ID) in the headers of the Razorpay API calls. Note: Razorpay supports the `X-Idempotency-Key` header for most endpoints.

#### PAY-03 — Floating Point Math for Financial Amounts
| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-1339](https://cwe.mitre.org/data/definitions/1339.html) — Insufficient Precision or Accuracy of a Real Number |
| **Category** | Financial Integrity |
| **Location** | [razorpay.ts:36](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/payments/providers/razorpay.ts#L36) |
| **Risk Score** | 4/10 |
| **Fix Difficulty** | Easy |

**Description:**
`Math.round(input.amount * 100)` is used to convert major units to minor units (paise). Floating-point math in JavaScript is inherently imprecise (`0.1 + 0.2 = 0.30000000000000004`). While `Math.round` mitigates standard precision drift, passing floats throughout the application for financial data is a dangerous pattern.

**Recommendation:**
Pass amounts purely in integers (minor units/cents/paise) across the entire stack.

---

### File Scores (`src/lib/payments/providers/razorpay.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 5/10 |
| **Financial Integrity** | 4/10 |
| **Code Quality** | 7/10 |
| **Performance** | 8/10 |
| **Reliability** | 4/10 |
| **Overall** | 5/10 |

---

## File 7: `src/lib/payments/providers/stripe.ts`

**Path:** [stripe.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/payments/providers/stripe.ts)
**Lines:** 238 | **Size:** 8KB

### Overview
Integrates Stripe Checkout for one-time payments and subscriptions.

---

### Findings

#### PAY-04 — Flawed Subscription Refund Resolution Logic
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-639](https://cwe.mitre.org/data/definitions/639.html) — Authorization Bypass Through User-Controlled Key |
| **OWASP** | A01:2021 — Broken Access Control |
| **Category** | Financial Integrity |
| **Location** | [stripe.ts:192-203](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/payments/providers/stripe.ts#L192-L203) |
| **Risk Score** | 7/10 |
| **Fix Difficulty** | Medium |
| **Estimated Time** | 2 hours |

**Description:**
To refund a subscription checkout (`cs_...`), the code looks up the subscription ID and fetches the most recent invoice (`invoices.list({ limit: 1 })`), refunding its payment intent. If a subscription has renewed multiple times, this logic will unconditionally refund the *latest* invoice, rather than the specific transaction the user requested.

**Business Impact:**
Refunding the wrong invoice leads to accounting discrepancies and potentially refunding larger/smaller amounts than intended.

**Recommendation:**
Do not resolve refunds via Checkout Session IDs (`cs_`). The application's database should track the exact `PaymentIntent` or `Charge` ID generated by the Stripe Webhook (`invoice.paid` or `checkout.session.completed`) and pass that specific ID to `createRefund`.

#### PAY-05 — Implicit Idempotency Key Generation Causes Double Refunds
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-362](https://cwe.mitre.org/data/definitions/362.html) |
| **OWASP** | A04:2021 — Insecure Design |
| **Category** | Reliability / Financial Integrity |
| **Location** | [stripe.ts:223](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/payments/providers/stripe.ts#L223) |
| **Risk Score** | 7/10 |
| **Fix Difficulty** | Easy |

**Description:**
`stripe.refunds.create(params)` does not supply an explicit `idempotencyKey` in the request options. The `stripe-node` SDK automatically generates an idempotency key *per request object*. If the application's network request to Stripe times out, and the application logic retries the `createRefund` function, `stripe-node` treats it as a brand new request with a *new* idempotency key, resulting in a double-refund.

**Business Impact:**
Direct financial loss through duplicate refunds.

**Recommendation:**
Always pass explicit, deterministically generated idempotency keys for mutations:
```typescript
await stripe.refunds.create(params, { idempotencyKey: `refund_${input.receipt}` });
```

#### PAY-06 — Floating Point Math for Financial Amounts
| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **Category** | Financial Integrity |
| **Location** | [stripe.ts:87](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/payments/providers/stripe.ts#L87) |
| **Risk Score** | 4/10 |

**Description:**
`Math.round(input.amount * 100)` is used to convert major units to minor units. Same finding as PAY-03.

---

### Positive Security Observations (stripe.ts)
1. ✅ **Proper Webhook Verification** — Uses `stripe.webhooks.constructEvent` which handles timing attacks, signature validation, and prevents timestamp replay attacks.
2. ✅ **API Version Pinning** — Explicitly pins `apiVersion: "2026-02-25.clover"` to prevent breaking changes if the Stripe account default version changes.

---

### File Scores (`src/lib/payments/providers/stripe.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 8/10 |
| **Financial Integrity** | 3/10 |
| **Code Quality** | 7/10 |
| **Performance** | 8/10 |
| **Reliability** | 5/10 |
| **Overall** | 6/10 |

---

## File 8: `src/app/api/payments/razorpay-webhook/route.ts`

**Path:** [route.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/app/api/payments/razorpay-webhook/route.ts)
**Lines:** 64 | **Size:** 2KB

### Overview
Handles incoming Razorpay webhooks. Verifies signatures and delegates `refund.*` events to the `refundService`.

---

### Findings

#### WEB-01 — Suppressed Webhook Retries on Transient Failures
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-391](https://cwe.mitre.org/data/definitions/391.html) — Unchecked Error Condition |
| **OWASP** | A09:2021 — Security Logging and Monitoring Failures |
| **Category** | Reliability / Financial Integrity |
| **Location** | [route.ts:59-62](file:///d:/Pratik/Dev/Projects/AuthPay/src/app/api/payments/razorpay-webhook/route.ts#L59-L62) |
| **Risk Score** | 9/10 |
| **Fix Difficulty** | Easy |

**Description:**
The webhook handler wraps its logic in a `try/catch`. In the `catch` block, it logs the error but returns an HTTP 200 `{"received": true}`. If the database goes down, or a race condition throws an error, the webhook returns a 200. Razorpay interprets this as successful delivery and will *never* retry. The webhook event (and the payment/refund state) is permanently lost.

**Business Impact:**
Loss of financial data consistency. Paid orders might never be fulfilled, and refunds might never be recorded, leading to customer disputes and manual reconciliation nightmares.

**Recommendation:**
Only return a 200 when the event is successfully processed. If a transient error occurs (e.g., database failure), throw a 500 so Razorpay retries the webhook later.

#### WEB-02 — Missing Critical Payment & Subscription Events
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-754](https://cwe.mitre.org/data/definitions/754.html) — Improper Check for Unusual or Exceptional Conditions |
| **Category** | Financial Integrity |
| **Location** | [route.ts:45-56](file:///d:/Pratik/Dev/Projects/AuthPay/src/app/api/payments/razorpay-webhook/route.ts#L45-L56) |
| **Risk Score** | 8/10 |
| **Fix Difficulty** | High |

**Description:**
The Razorpay webhook only implements handlers for `refund.created`, `refund.processed`, `refund.failed`, and `refund.speed_changed`. It completely ignores all other events like `payment.captured`, `order.paid`, `subscription.activated`, `subscription.charged`, etc.

**Business Impact:**
Razorpay payments and subscriptions will never activate backend state unless there is a separate client-side polling mechanism, which is inherently insecure and unreliable.

**Recommendation:**
Implement full event coverage for the Razorpay payment and subscription lifecycle, ensuring parity with the Stripe integration.

---

### Positive Security Observations (razorpay-webhook)
1. ✅ **Raw Body Handling & HMAC Verification** — The route correctly disables Next.js body parsing to safely retrieve the raw `ArrayBuffer`. It perfectly implements `createHmac("sha256")` and `timingSafeEqual` for secure, timing-attack resistant webhook verification.

---

### File Scores (`src/app/api/payments/razorpay-webhook/route.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 8/10 |
| **Webhook Integrity** | 2/10 |
| **Financial Integrity** | 1/10 |
| **Reliability** | 1/10 |
| **Overall** | 3/10 |

---

## File 9: `src/app/api/payments/stripe-webhook/route.ts`

**Path:** [route.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/app/api/payments/stripe-webhook/route.ts)
**Lines:** 326 | **Size:** 10KB

### Overview
Handles Stripe webhook events (`checkout.session.completed`, `invoice.payment_succeeded`, etc.). Updates orders and activates subscriptions securely via row-level locks and transaction blocks.

---

### Findings

#### WEB-03 — Suppressed Webhook Retries on Transient Failures
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **Category** | Reliability / Financial Integrity |
| **Location** | [route.ts:94-98](file:///d:/Pratik/Dev/Projects/AuthPay/src/app/api/payments/stripe-webhook/route.ts#L94-L98) |
| **Risk Score** | 9/10 |
| **Fix Difficulty** | Easy |

**Description:**
Exactly like `WEB-01`, this route catches all handler errors and explicitly returns `NextResponse.json({ received: true, warning: "Handler error logged" })`. The comment even says: `// Return 200 to prevent Stripe from retrying`. This breaks Stripe's at-least-once delivery guarantee. If your server is momentarily disconnected from the database, you lose the Stripe event forever.

**Recommendation:**
Remove the `try/catch` around the `switch` statement (or throw a 500 in the catch). Let Next.js return a 500 so Stripe's retry backoff algorithm kicks in and delivers it when the system recovers.

#### WEB-04 — Unhandled Subscription Cancellation Events
| Field | Value |
|---|---|
| **Severity** | 🔵 **LOW** |
| **Category** | Business Logic |
| **Location** | [route.ts:63-90](file:///d:/Pratik/Dev/Projects/AuthPay/src/app/api/payments/stripe-webhook/route.ts#L63-L90) |
| **Risk Score** | 3/10 |
| **Fix Difficulty** | Easy |

**Description:**
The handler processes successful checkouts and recurring invoice payments, but it ignores `customer.subscription.deleted`. If a user cancels via the Stripe Billing Portal, or if Stripe cancels the subscription due to fraud/disputes, your backend will never know, and the user might retain access until the billing cycle expires.

**Recommendation:**
Add a handler for `customer.subscription.deleted` to immediately deactivate the `userSubscriptions` record.

---

### Positive Security Observations (stripe-webhook)
1. ✅ **Row-Level Locking (Pessimistic Concurrency Control)** — Inside `activateStripeSubscriptionInTx`, the code correctly executes `SELECT 1 FROM users WHERE id = ${userId} FOR UPDATE`. This locks the user row for the duration of the transaction, completely mitigating check-then-act race conditions during concurrent webhook deliveries.
2. ✅ **Safe SQL Parameterization** — The raw SQL query `${userId}` within Drizzle's `sql` template literal perfectly parameterizes the variable, avoiding SQL injection.
3. ✅ **Idempotency by Design** — Updating the `nextBillingDate` to Stripe's absolute `period.end` timestamp (rather than adding 1 month relative to current time) ensures that duplicate webhook deliveries are completely idempotent.

---

### File Scores (`src/app/api/payments/stripe-webhook/route.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 9/10 |
| **Webhook Integrity** | 7/10 |
| **Financial Integrity** | 8/10 |
| **Reliability** | 2/10 |
| **Overall** | 6/10 |

---

## File 10: `src/server/db/schema/schema.ts`

**Path:** [schema.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/db/schema/schema.ts)
**Lines:** 646 | **Size:** 30KB

### Overview
Defines all PostgreSQL database tables using Drizzle ORM. Establishes the core data models for users, billing, sessions, and RBAC.

---

### Findings

#### DB-01 — Plaintext Storage of Highly Sensitive Secrets
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-256](https://cwe.mitre.org/data/definitions/256.html) — Unprotected Storage of Credentials |
| **OWASP** | A02:2021 — Cryptographic Failures |
| **Category** | Database Security |
| **Location** | [schema.ts:271, 289, 321](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/db/schema/schema.ts) |
| **Risk Score** | 8/10 |

**Description:**
The database stores TOTP seeds (`twoFactorAuth.secret`), TOTP backup codes (`twoFactorAuth.backupCodes`), active session tokens (`sessions.token`), and password reset tokens in absolute plaintext. If an attacker gains read access to the database (via SQL injection, a leaked backup, or compromised credentials), they immediately compromise all active sessions and bypass all 2FA protections.

**Recommendation:**
- Hash `sessions.token` and `passwordResetTokens.token` with SHA-256.
- Encrypt `twoFactorAuth.secret` using a symmetric KMS-backed key (AES-256-GCM) before storing it.
- Hash `twoFactorAuth.backupCodes` using bcrypt/Argon2 exactly as you would passwords.

#### DB-02 — Broken Foreign Key Cascades Breaking Data Integrity
| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-664](https://cwe.mitre.org/data/definitions/664.html) — Improper Control of a Resource Through its Lifetime |
| **Category** | Data Integrity |
| **Location** | [schema.ts:61, 120, 599](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/db/schema/schema.ts) |
| **Risk Score** | 6/10 |

**Description:**
Several tables that reference `users.id` (such as `refundRequests`, `errorLogs`, `adminDashboardStats`) do NOT define `onDelete: 'cascade'` or `onDelete: 'set null'`. PostgreSQL defaults to `NO ACTION` (restrict). If an administrator attempts to delete a user account, PostgreSQL will throw a foreign key constraint violation and abort the transaction if that user has a pending refund or a logged error.

**Recommendation:**
Since the schema has no soft-delete `deletedAt` column, ensure all tables referencing `users.id` have explicit `onDelete` behaviors configured to allow account deletion, or implement a universal soft-delete strategy.

#### DB-03 — Inconsistent Financial Data Types
| Field | Value |
|---|---|
| **Severity** | 🔵 **LOW** |
| **Category** | Financial Integrity |
| **Location** | [schema.ts:7, 162, 466](file:///d:/Pratik/Dev/Projects/AuthPay/src/server/db/schema/schema.ts) |
| **Risk Score** | 3/10 |

**Description:**
The schema uses a mix of `varchar` (`subscriptionPlans.price`, `billings.amount`) and `integer` (`paymentOrders.amountMinor`, `refundRequests.amountMinor`) for financial amounts. Storing numbers as strings prevents DB-level aggregations (`SUM()`) and forces application-level parsing.

**Recommendation:**
Standardize all financial amounts to `integer` (minor units / cents / paise) across the entire schema.

---

### File Scores (`src/server/db/schema/schema.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 4/10 |
| **Database Design** | 6/10 |
| **Maintainability** | 8/10 |
| **Overall** | 6/10 |

---

## File 11: `src/lib/rbac/rbac-service.ts`

**Path:** [rbac-service.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/rbac-service.ts)
**Lines:** 1120 | **Size:** 35KB

### Overview
A policy-based Role-Based Access Control engine handling role assignment, permission inheritance, and authorization checks.

---

### Findings

#### AUTH-01 — Distributed Cache Desynchronization (Cache Poisoning)
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-613](https://cwe.mitre.org/data/definitions/613.html) — Insufficient Session Expiration |
| **OWASP** | A01:2021 — Broken Access Control |
| **Category** | Authorization |
| **Location** | [rbac-service.ts:25-27, 1109-1111](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/rbac-service.ts#L25-L27) |
| **Risk Score** | 10/10 |
| **Fix Difficulty** | Medium |

**Description:**
The RBAC engine uses a local, in-memory `Map` to cache user permissions for 5 minutes (`CACHE_TTL`). In any multi-instance deployment (Vercel Serverless, Kubernetes, auto-scaling instances), modifying a user's role and calling `this.clearCache()` will *only* clear the cache on the instance that processed the request. All other instances will serve stale, cached permissions for up to 5 minutes.

**Business Impact:**
If a malicious employee is terminated and an admin revokes their access, the terminated employee retains full authorization on all other instances for 5 minutes, giving them ample time to exfiltrate data or cause destruction.

**Recommendation:**
Use a centralized cache (e.g., Redis) that all instances read from, or abandon caching entirely. PostgreSQL is highly optimized for index-backed permission joins; the in-memory cache is a premature optimization introducing critical vulnerabilities.

#### AUTH-02 — Privilege Escalation via `setRolePermissions` Priority Bypass
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-269](https://cwe.mitre.org/data/definitions/269.html) — Improper Privilege Management |
| **OWASP** | A01:2021 — Broken Access Control |
| **Category** | Authorization |
| **Location** | [rbac-service.ts:830-887](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/rbac-service.ts#L830-L887) |
| **Risk Score** | 10/10 |
| **Fix Difficulty** | Medium |

**Description:**
The `setRolePermissions` function verifies that the caller has `role:update`. However, it **completely fails** to check two critical things:
1. It does not check if the role being updated has a higher priority than the admin (unlike `updateRole` and `assignRole`).
2. It does not check if the admin *actually possesses* the permissions they are granting to the role.

**Attack Vector:**
A low-level moderator with `role:update` can call `setRolePermissions` on a role they belong to, and grant that role `admin:access`, `billing:manage`, and `user:manage`. They have just escalated themselves to Super Admin capabilities without being a Super Admin.

**Recommendation:**
In `setRolePermissions`:
1. Verify `role.priority < adminPriority` (unless Super Admin).
2. Verify that the `permissionIds` being assigned are a strict subset of the `adminUserId`'s own effective permissions. An admin cannot delegate a permission they do not possess.

#### AUTH-03 — RBAC Ignores Account Status (Suspension Bypass)
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **Category** | Authorization |
| **Location** | [rbac-service.ts:1037-1089](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/rbac-service.ts#L1037-L1089) |
| **Risk Score** | 8/10 |

**Description:**
The `loadAndCacheUserData` function aggregates permissions based purely on the `userRoles` table. It never queries the `users` table to check if `isSuspended === true` or `isActive === false`. If a controller relies solely on `RBACService.hasPolicy(userId, "content:create")`, a suspended user will be granted access because their roles remain intact.

**Recommendation:**
In `loadAndCacheUserData`, query the `users` table. If `isSuspended` is true, immediately return an empty permission set.

#### AUTH-04 — Silent Audit Logging Failures
| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-391](https://cwe.mitre.org/data/definitions/391.html) — Unchecked Error Condition |
| **Category** | Reliability |
| **Location** | [rbac-service.ts:995-1021](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/rbac/rbac-service.ts#L995-L1021) |
| **Risk Score** | 5/10 |

**Description:**
The `logAudit` function wraps the database insert in a `try/catch`. If the insert fails (e.g., database connection lost, disk full), it logs to the console and returns `undefined`. The calling functions (`assignRole`, `updateRole`) do not check this return value and succeed anyway.

**Recommendation:**
For compliance (SOC 2, PCI), security audits must fail closed. If an audit log cannot be written, the authorization change *must not* take effect. Throw an exception in `logAudit` and roll back the transaction.

---

### Positive Security Observations (rbac-service)
1. ✅ **Policy-Based Architecture** — Linking users to roles and roles to fine-grained policies (permissions) is the gold standard for enterprise RBAC.
2. ✅ **Inheritance Model** — The `ACTION_INHERITANCE` map (`manage` implying CRUD) is a highly efficient way to keep token payloads and cache sizes small while supporting complex policy aggregation.

---

### File Scores (`src/lib/rbac/rbac-service.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 3/10 |
| **Authorization** | 4/10 |
| **Performance** | 9/10 |
| **Reliability** | 4/10 |
| **Scalability** | 3/10 |
| **Overall** | 4/10 |

---

## File 12: `src/lib/middleware/rate-limit.ts`

**Path:** [rate-limit.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/middleware/rate-limit.ts)
**Lines:** 450 | **Size:** 14KB

### Overview
Wraps Next.js API routes with rate limiting, request queuing, response caching, and circuit breaking capabilities.

---

### Findings

#### MID-01 — `X-User-Id` Header Spoofing (Broken Access Control)
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-290](https://cwe.mitre.org/data/definitions/290.html) — Authentication Bypass by Spoofing |
| **Category** | Request Protection |
| **Location** | [rate-limit.ts:90-98](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/middleware/rate-limit.ts#L90-L98) |
| **Risk Score** | 10/10 |

**Description:**
The `getUserId` function reads the `x-user-id` header directly from the incoming request and immediately trusts it to identify the user. This ID is then used to determine request priority (`getRequestPriority`) and generate response cache keys.
Any external attacker can simply send `X-User-Id: <admin-id>` in their request to completely bypass rate limit restrictions, hijack high-priority request queues, and poison the cache for legitimate users.

**Recommendation:**
Never trust client-provided headers for identity unless they are cryptographically signed and injected by an upstream trusted proxy/gateway. Identity must be resolved by verifying the session token (which the function attempts as a fallback on line 94, but only after blindly trusting the header). Remove the `x-user-id` header check entirely.

#### MID-02 — Rate Limit Bypass via `X-Forwarded-For` Spoofing
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-348](https://cwe.mitre.org/data/definitions/348.html) — Use of Less Trusted Source |
| **Category** | Request Protection |
| **Location** | [rate-limit.ts:77-85](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/middleware/rate-limit.ts#L77-L85) |
| **Risk Score** | 8/10 |

**Description:**
`getClientIdentifier` extracts the client IP from the `x-forwarded-for` header by taking the first IP in the list. This header is completely attacker-controlled. An attacker can write a script that sends `X-Forwarded-For: <random-ip>` on every request, completely circumventing all Per-IP rate limiting and exhausting the API's global limits.

**Recommendation:**
Use Next.js's built-in `request.ip` which securely resolves the IP from Vercel's trusted edge headers. If running on a custom server, you must parse `x-forwarded-for` backwards and only trust IPs up to the last known trusted proxy.

#### MID-03 — Asynchronous Queue Exhaustion
| Field | Value |
|---|---|
| **Severity** | 🟡 **MEDIUM** |
| **CWE** | [CWE-400](https://cwe.mitre.org/data/definitions/400.html) — Uncontrolled Resource Consumption |
| **Category** | Scalability |
| **Location** | [rate-limit.ts:228](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/middleware/rate-limit.ts#L228) |
| **Risk Score** | 5/10 |

**Description:**
When global rate limits are hit, requests are queued: `await requestQueue.enqueue(...)`. This wait has no explicit timeout in the middleware. If the queue backs up, thousands of incoming requests will hang indefinitely, tying up Edge/Node.js connections, maximizing memory usage, and eventually causing widespread 504 Gateway Timeouts across the entire cluster.

**Recommendation:**
The queue must have a strict timeout (e.g., 2000ms). If a request cannot be processed within that time, it should aggressively fail-fast with a 503 Overloaded response instead of waiting indefinitely.

---

### File Scores (`src/lib/middleware/rate-limit.ts`)
| Category | Score (0-10) |
|---|---|
| **Security** | 2/10 |
| **Request Protection** | 3/10 |
| **Performance** | 7/10 |
| **Reliability** | 4/10 |
| **Scalability** | 5/10 |
| **Overall** | 3/10 |

---

## File 13: `src/lib/middleware/rsc-protection.ts`

**Path:** [rsc-protection.ts](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/middleware/rsc-protection.ts)
**Lines:** 455 | **Size:** 13KB

### Overview
A custom security middleware designed to detect and block malicious payloads exploiting React Server Component (RSC) vulnerabilities like CVE-2025-55182.

---

### Findings

#### MID-04 — Middleware Crash Fail-Open (Complete Bypass)
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-755](https://cwe.mitre.org/data/definitions/755.html) — Improper Handling of Exceptional Conditions |
| **Category** | Request Protection |
| **Location** | [rsc-protection.ts:198, 397-401](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/middleware/rsc-protection.ts#L198) |
| **Risk Score** | 10/10 |

**Description:**
The `validatePayload` function attempts to base64-decode payloads using `Buffer.from(payload, 'base64')`. However, this middleware runs in the Next.js Edge Runtime, which **does not support the Node.js Buffer API**. Calling `Buffer.from()` in the Edge runtime throws a `ReferenceError`.
The `try/catch` block around the execution (Line 397) catches this crash, logs it, and returns `null`, which allows the request to proceed. An attacker can completely bypass all RSC protection rules simply by sending a valid base64 string, causing the middleware to crash and fail-open.

**Recommendation:**
1. Replace `Buffer.from()` with Edge-compatible base64 decoding (`atob()`).
2. Security middleware must **Fail-Closed**. If the security inspection crashes, the request must be blocked (return a 500 or 403), not allowed through.

#### MID-05 — Denial of Service via Memory Exhaustion (OOM)
| Field | Value |
|---|---|
| **Severity** | 🔴 **CRITICAL** |
| **CWE** | [CWE-400](https://cwe.mitre.org/data/definitions/400.html) — Uncontrolled Resource Consumption |
| **Category** | Reliability |
| **Location** | [rsc-protection.ts:318-323](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/middleware/rsc-protection.ts#L318-L323) |
| **Risk Score** | 9/10 |

**Description:**
To inspect the body, the middleware does `body = await clonedRequest.text();`. This reads the entire request payload into memory as a string. The size check (`payload.length > MAX_PAYLOAD_SIZE`) happens *inside* `validatePayload`, which is called *after* the entire string is loaded into memory. An attacker sending a 200MB file upload or a slowloris-style stream will exhaust the Edge runtime's memory limits instantly, causing widespread Denial of Service.

**Recommendation:**
Do not buffer the entire request into memory. Next.js limits Edge middleware execution, and large bodies will crash it. If payload inspection is required, stream the body and abort the stream if bytes read exceed `MAX_PAYLOAD_SIZE` (1MB).

#### MID-06 — Regular Expression Denial of Service (ReDoS)
| Field | Value |
|---|---|
| **Severity** | 🟠 **HIGH** |
| **CWE** | [CWE-1333](https://cwe.mitre.org/data/definitions/1333.html) — Inefficient Regular Expression Complexity |
| **Category** | Performance |
| **Location** | [rsc-protection.ts:16-110, 174-178](file:///d:/Pratik/Dev/Projects/AuthPay/src/lib/middleware/rsc-protection.ts#L174-L178) |
| **Risk Score** | 8/10 |

**Description:**
The `DANGEROUS_PATTERNS` array contains over 50 complex regular expressions, many with catastrophic backtracking vulnerabilities (e.g., `/curl\s+.*\|\s*(bash|sh)/i`). Applying 50+ synchronous regex evaluations against a 1MB payload will block the JavaScript event loop for seconds, severely degrading performance and leaving the application highly vulnerable to ReDoS attacks.

**Recommendation:**
Do not write custom Web Application Firewalls (WAF) in Next.js Middleware. Remove this custom RSC protection file entirely and rely on a purpose-built WAF (Cloudflare, AWS WAF, or Vercel Edge WAF) to block malicious patterns before they ever reach your application runtime.

---


---

## Authentication API Section

### 1. `validate-credentials`
- **Overview**: Validates user email and password. Logs SQL injection attempts and handles rate limiting.
- **Findings**: 
  - **AUTH-11 — User Enumeration via Authentication Responses** (🟡 Medium): Endpoint returns "User not found" explicitly, enabling email harvesting.
- **Positive observations**: Implements account lockout after 5 failed attempts.
- **Code quality review**: Good logic separation, uses sanitization.
- **Security review**: Missing generic error messages, otherwise secure.
- **Performance review**: Standard BCrypt operations, acceptable.
- **Reliability review**: Graceful error handling for missing fields.
- **Production readiness score**: 7/10
- **Action items**: Return generic "Invalid email or password" error.

### 2. `forgot-password`
- **Overview**: Initiates the password reset process.
- **Findings**: No critical issues.
- **Positive observations**: Reuses standardized route and limits requests heavily.
- **Code quality review**: Minimal wrapper, easy to read.
- **Security review**: Securely delegates to established `Routes` handler.
- **Performance review**: Negligible overhead.
- **Reliability review**: Robust.
- **Production readiness score**: 10/10
- **Action items**: None.

### 3. `reset-password`
- **Overview**: Executes the password reset with a verified token.
- **Findings**: No critical issues.
- **Positive observations**: Requires `verifiedToken` instead of a raw code, establishing a secure chain.
- **Code quality review**: Strict input validation, well commented.
- **Security review**: Successfully prevents reset token guessing.
- **Performance review**: Good.
- **Reliability review**: Handled gracefully.
- **Production readiness score**: 10/10
- **Action items**: None.

### 4. `verify-reset-code`
- **Overview**: Verifies the OTP code during password reset.
- **Findings**: 
  - **AUTH-15 — Plaintext Storage of Verification Tokens** (🟡 Medium): `sessionToken` and `verifiedToken` are stored in plaintext.
- **Positive observations**: Checks SQL injection patterns, uses strict timing/expiry limits.
- **Code quality review**: Solid design but lacks hashed token storage.
- **Security review**: Prevents simple bypasses but vulnerable to DB leak.
- **Performance review**: Fast lookup.
- **Reliability review**: Good.
- **Production readiness score**: 8/10
- **Action items**: Store SHA-256 hashes of the session and verified tokens.

### 5. `verify-2fa`
- **Overview**: Verifies 2FA OTP codes.
- **Findings**: 
  - **AUTH-12 — Client-Exposed Authentication Bypass Directives** (🟠 High): Returns `{ password: '2fa-verified', skipPasswordCheck: 'true' }` to the client.
- **Positive observations**: Rate limited, properly verifies the short-lived session token.
- **Code quality review**: Exposes internal auth mechanisms to the frontend (anti-pattern).
- **Security review**: By giving the client `skipPasswordCheck`, it corroborates the AUTH-01 vulnerability.
- **Performance review**: Good.
- **Reliability review**: Good.
- **Production readiness score**: 4/10
- **Action items**: Use server-side signed tokens instead of `skipPasswordCheck`.

### 6. `send-otp`
- **Overview**: Sends an OTP for verification purposes.
- **Findings**: No critical issues found in the wrapper.
- **Positive observations**: Strictly rate limited (5 per 15 mins).
- **Code quality review**: Clean delegation.
- **Security review**: Protected by rate limiters.
- **Performance review**: Good.
- **Reliability review**: Good.
- **Production readiness score**: 9/10
- **Action items**: None.

### 7. `passwordless`
- **Overview**: Manages passwordless login (magic links and OTP).
- **Findings**: 
  - **AUTH-13 — Unauthenticated Mass Account Creation** (🟠 High): `send/route.ts` has no rate limit and automatically creates user accounts.
  - **AUTH-14 — OTP Brute-Force Vulnerability** (🔴 Critical): `verify/route.ts` has no rate limits, allowing trivial 6-digit OTP bruteforcing.
- **Positive observations**: Uses Zod for input validation.
- **Code quality review**: Inconsistent middleware usage (missing `rateLimiters`).
- **Security review**: Very poor. Exposes the app to DoS, brute force, and complete account takeover.
- **Performance review**: Good.
- **Reliability review**: Fails open to attacks.
- **Production readiness score**: 2/10
- **Action items**: Add `rateLimiters.auth` immediately.

---

## Administration API Section

### `admin/users`
- **Purpose**: List users and update roles.
- **Findings**: 
  - **ADMIN-01 — Algorithmic Complexity DoS** (🟡 Medium): Uses unindexed `ilike` with leading wildcard `%search%`.
- **Authorization review**: Protected by `requireAdmin` and `withPolicy(..., API_POLICIES.USER_MANAGE)`.
- **Security review**: Vulnerable to complex query DoS.
- **Code quality**: Good use of centralized helpers.
- **Performance**: Will degrade severely with large user bases.
- **Reliability**: Fine for small datasets.
- **Risk score**: 5/10
- **Recommendations**: Remove leading wildcard from searches or use text search indexes.

### `admin/roles`
- **Purpose**: List and create roles.
- **Findings**: 
  - **ADMIN-02 — Missing Pagination Limits** (🟡 Medium): `limit` is parsed without an upper bound, leading to OOM risks.
- **Authorization review**: Properly protected.
- **Security review**: Missing boundaries on pagination.
- **Code quality**: Clean async logic.
- **Performance**: High risk if `limit` is abused.
- **Reliability**: Memory crash risk.
- **Risk score**: 6/10
- **Recommendations**: Bound the limit parameter (`Math.min(limit, 100)`).


# Cross-File Observations

### Schema ↔ RBAC Desynchronization
1. **The Suspension Gap**: The database schema explicitly defines `isSuspended` and `isActive` on the `users` table, but the `RBACService` completely ignores them when computing authorization. The schema implies a capability that the engine fails to enforce.
2. **Missing Transactions**: `RBACService` performs multi-step operations (e.g., deleting old roles, inserting new roles, writing audit logs) without wrapping them in Drizzle transactions (`db.transaction`). If the server crashes between deleting old roles and inserting new ones, the user's access is permanently corrupted.

### Architecture Review
**Is this RBAC implementation suitable for Enterprise deployments?**
In its current state: **No.**
- The reliance on local in-memory caching (`Map`) makes it incompatible with multi-instance scalable deployments.
- The `setRolePermissions` escalation flaw completely breaks multi-tenant and delegated administration models.
- However, the underlying Drizzle schema is extremely robust and well-normalized. If the caching mechanism is replaced with Redis (or pure database queries) and the priority bypasses are patched, this RBAC system is fully capable of scaling to millions of permission checks per day.

---

### Authentication Flow — Critical Vulnerability Chain

The `skipPasswordCheck` mechanism creates a critical vulnerability chain across multiple files:

```
┌──────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION BYPASS CHAIN                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. verify-2fa/route.ts returns { skipPasswordCheck: 'true' }    │
│                         ↓                                        │
│  2. Client receives credentials in API response body             │
│                         ↓                                        │
│  3. Client sends signIn("credentials", { skipPasswordCheck })    │
│                         ↓                                        │
│  4. auth.config.ts authorize() skips password + 2FA check        │
│                         ↓                                        │
│  5. Full session is created                                      │
│                                                                  │
│  ATTACK: Intercept at step 2 or replay at step 3 with any        │
│  email + skipPasswordCheck='true' = complete auth bypass         │
│                                                                  │
│  Affected files:                                                 │
│  • src/config/auth.config.ts (accepts the flag)                  │
│  • src/app/api/auth/verify-2fa/route.ts (returns the flag)       │
│  • src/app/api/auth/passwordless/verify/route.ts (returns flag)  │
│  • src/app/api/auth/totp/verify-login/route.ts (returns flag)    │
│  • src/contexts/auth-context.tsx (passes the flag)               │
│  • src/components/auth/LoginForm.tsx (passes the flag)           │
│  • src/components/user/PricingAuthModal.tsx (passes the flag)    │
│  • src/app/auth/2fa-verify/page.tsx (passes the flag)            │
│  • src/app/auth/magic-link/page.tsx (passes the flag)            │
└──────────────────────────────────────────────────────────────────┘
```

> **This is the highest-risk finding in the audit so far.** It requires immediate remediation before production deployment.

### Session Lifecycle
- JWT refresh interval is 5 minutes — creates a window for stale role/suspension data.
- Session callback returns empty object on expiry — potential runtime errors.
- Password change correctly invalidates sessions.


### Shared Vulnerabilities
- **Rate Limiting Inconsistency**: While some routes (`forgot-password`, `verify-2fa`) strictly apply `rateLimiters.auth`, others like `passwordless` completely omit it, creating massive blind spots for brute-forcing.
- **Authentication Flow Flaws**: The `skipPasswordCheck` parameter discovered earlier is actively supplied *by the backend* to the frontend in the 2FA and passwordless verify routes. This represents a complete architectural breakdown of trust boundaries.

### OAuth Flow
- Auto-linking by email is a critical account takeover risk.
- OAuth tokens stored in plaintext.
- No email validation before lookup.

### Secret Management
- Hardcoded `'fallback-secret'` in JWT signing/verification.
- Dual secret variables (`NEXTAUTH_SECRET` / `AUTH_SECRET`).

---

# Production Readiness Checklist

| Category | Status | Notes |
|---|---|---|
| Authentication | 🔴 FAIL | `skipPasswordCheck` bypass (AUTH-01) |
| Authorization | 🔴 FAIL | Default-allow routing (AUTH-07), Privilege escalation (AUTH-02), Cache poisoning (AUTH-01) |
| Session Security | 🔴 FAIL | Strategy mismatch breaks API (SES-01), DB DoS (SES-03) |
| JWT Configuration | 🟡 PARTIAL | Fallback secret (AUTH-02), stale role data (AUTH-06) |
| Cookie Security | 🟡 PARTIAL | Cookie clearing domain mismatch (SES-05) |
| CSRF Protection | 🔴 FAIL | Missing CSRF validation in custom API wrapper (SES-02) |
| XSS Prevention | 🟡 PARTIAL | CSP allows unsafe-eval/unsafe-inline (AUTH-20) |
| SQL Injection Prevention | 🟢 PASS | Drizzle ORM uses parameterized queries |
| Secrets Management | 🔴 FAIL | Hardcoded fallback secret (AUTH-02), Plaintext TOTP/Session storage (DB-01) |
| Environment Variables | 🟡 PARTIAL | Dual secret vars, not validated at startup |
| Logging & Monitoring | 🔴 FAIL | PII in logs, silent audit log failures (AUTH-04) |
| Rate Limiting | 🔴 FAIL | Bypassable via X-Forwarded-For spoofing (MID-02) |
| Input Validation | 🔴 FAIL | Unsafe payload buffering (MID-05), Regex DoS (MID-06) |
| Payment Security | 🔴 FAIL | Missing idempotency interface (PAY-10), Geo-spoofing (PAY-08), Negative refunds (REF-02) |
| Gateway Architecture | 🔴 FAIL | Edge runtime crashes on require() (PAY-11), Missing failover (PAY-09), Incomplete abstraction (PAY-12) |
| Background Jobs | 🔴 FAIL | Unsafe setInterval usage in serverless env (CLN-01), Unbatched DB queries lock tables (CLN-02) |
| Webhook Verification | 🟢 PASS | Signatures correctly validated using raw body buffers in both webhooks |
| Database Security | 🔴 FAIL | Plaintext token storage (DB-01), Broken cascades (DB-02) |
| Webhook Reliability | 🔴 FAIL | Retries suppressed on both providers (WEB-01, WEB-03) |
| Error Handling | 🔴 FAIL | Security middleware fails open on crashes (MID-04) |
| Security Headers | 🟢 PASS | HSTS, X-Frame-Options, X-Content-Type-Options present |
| TOTP / 2FA | 🔴 FAIL | Bypassable (AUTH-03), Exposes bypass params (AUTH-12) |
| Passwordless Login | 🔴 FAIL | Returns skipPasswordCheck, missing rate limits (AUTH-13, AUTH-14) |
| OAuth Implementation | 🔴 FAIL | Auto-linking account takeover (AUTH-04) |
| Open Redirect Prevention | ⏳ Pending | — |
| SSRF Prevention | ⏳ Pending | — |
| IDOR Prevention | ⏳ Pending | — |
| Race Condition Prevention | 🔴 FAIL | Non-atomic creation (AUTH-08), Non-atomic registration (AUTH-30) |

---

# Recommendations

### 🔴 Immediate Fixes (Must fix before production)

1. **Replace `skipPasswordCheck` with server-side signed tokens** — This is the single most critical fix. Every file that passes `skipPasswordCheck` as a client-sent parameter must be updated to use a cryptographically signed, purpose-bound, single-use, short-lived server token. (AUTH-01, AUTH-03)

2. **Remove all hardcoded fallback secrets** — Replace with startup validation that crashes the application if `AUTH_SECRET` is not set. (AUTH-02)

3. **Fix OAuth account linking** — Do not auto-link OAuth accounts to existing users based on email alone. Require authenticated session or email verification. (AUTH-04)

### 🟡 Short-Term Improvements (Fix within first sprint)

4. **Enforce Rate Limits on Passwordless APIs** — Add `rateLimiters.auth` to prevent trivial OTP brute-forcing and mass account creation. (AUTH-13, AUTH-14)


4. **Add suspension check to JWT refresh** — Check `isSuspended` during token refresh. Reduce refresh interval to 60 seconds. (AUTH-06)

5. **Encrypt OAuth tokens at rest** — Use AES-256-GCM for `refresh_token`, `access_token`, `id_token`. (AUTH-07)

6. **Wrap user creation in transactions** — Use `db.transaction()` for multi-insert operations. (AUTH-08)

7. **Fix IP address parsing** — Parse first IP from `x-forwarded-for`, validate format. (AUTH-05)

8. **Remove PII from logs** — Use user IDs instead of emails. (AUTH-13)

### 🔵 Long-Term Improvements

9. **Implement nonce-based CSP** — Remove `unsafe-eval` and `unsafe-inline`. (AUTH-20)
10. **Refactor auth callbacks** — Split monolithic callbacks into focused service functions. (Code Quality)
11. **Add structured logging** — Replace `console.log/error` with a proper logger (pino, winston). (AUTH-12, AUTH-13)
12. **Standardize secrets** — Single `AUTH_SECRET` variable with startup validation. (AUTH-17)

### 🏗️ Architecture Improvements

13. **Extract login tracking to a service** — The JWT callback should not handle login history, email sending, and role resolution. These should be in a `LoginTrackingService`.
14. **Implement event-driven architecture** — Login events should emit events that subscribers handle (login tracking, alerts, analytics).
15. **Add server-side session store** — For high-security operations (payment, settings changes), augment JWT with a server-side session check.

### ⚡ Performance Improvements

16. **Replace dynamic imports with static imports** — Move all `await import()` calls to top-level. (AUTH-15)
17. **Batch database queries** — Use `Promise.all` for independent queries in the JWT callback.
18. **Use database timestamps** — Replace `new Date().toISOString()` with `sql\`NOW()\``. (AUTH-16)

---

# Final Security Score

| Severity | Count |
|---|---|
| 🔴 Critical | 18 |
| 🟠 High | 26 |
| 🟡 Medium | 23 |
| 🔵 Low | 10 |
| ⚪ Informational | 11 |

**Scores for Files Reviewed (21 Files — Core Services, Auth, Payments, Middleware, Architecture):**

| Dimension | Score |
|---|---|
| Security | 2/10 |
| Financial Integrity | 1/10 |
| System Architecture | 2/10 |
| Authorization | 3/10 |
| Database Design | 5/10 |
| Reliability | 1/10 |
| Scalability | 2/10 |
| Maintainability | 4/10 |
| **Overall Production Readiness** | **9/100** |

**Verdict:** 🔴 **Not Production Ready**

> The core business layer introduces severe financial and operational risks. Financial mutations (like Refunds) interact with third-party gateways without Idempotency Keys, guaranteeing that temporary network failures will result in duplicate refunds and financial loss. Furthermore, input validation fails to check for negative refund amounts. Operationally, the application attempts to schedule background cleanup jobs using Node's `setInterval`, which will cause runaway memory leaks in a Next.js serverless environment, while simultaneously executing unbounded `UPDATE` queries that will lock the database under scale.

**Production Recommendation:** 🔴 **Not Ready — Authorization & Routing Layers Require Complete Redesign**

---

*This is a living document. It is updated after every file review and reflects the current state of the AuthPay security audit at all times.*

*Next recommended file for review: Any remaining critical services.*
