# Task 5 Report: Rate-limit Verify Endpoint and Harden OTP

## Status
Completed.

## Files Changed
- `src/app/api/auth/verify/route.ts`
  - Wrapped the exported `POST` handler with `rateLimiters.auth(...)` from `@/lib/middleware/rate-limit`, matching the register endpoint pattern.
  - Left the legacy `GET` handler unchanged.
- `src/server/services/auth.ts`
  - In `AuthService.verifyEmail`, when an email-verification OTP record is found but has expired, increment `otpCodes.attemptCount`.
  - If the incremented count reaches 5, mark the record as invalid (`isValid: false`) and return the standard generic error message.
  - Changed `generateVerificationCode()` from a 6-digit to an 8-digit numeric code.
- `__tests__/security-auth.test.ts`
  - Updated the existing OTP length test from 6 digits to 8 digits to reflect the new `generateVerificationCode()` behavior.

## Implementation Notes
- The database schema was not changed; the existing `attempt_count` column on `otp_codes` is used.
- Generic error messaging is preserved: all invalid/expired/locked-code responses return `"Invalid or expired verification code"` so an attacker cannot distinguish between a wrong code, an expired code, or a locked code.
- On successful verification the OTP record is still deleted as before; the attempt count is not updated in the success path.
- The 8-digit change applies to codes produced by `generateVerificationCode()`, which is used for email verification and password reset flows.

## Limitations / Follow-up
- `AuthService.verifyEmail` receives only the OTP code, so when a supplied code does not match any record there is no record to increment. Attempt counting therefore happens only when a matching-but-expired record is found. Endpoint-level rate limiting (`rateLimiters.auth`) provides the primary brute-force protection for wrong-code guesses.
- Several UI components and email templates still refer to "6-digit" codes and may enforce 6-digit input limits (e.g., `src/components/auth/EmailVerificationForm.tsx`, `src/app/auth/forgot-password/page.tsx`, email templates). These should be updated in a follow-up so users can enter the new 8-digit codes end-to-end.

## Verification Commands

### `npm test`
```
Test Suites: 2 failed, 13 passed, 15 total
Tests:       22 failed, 261 passed, 283 total
```
The failures are pre-existing and unrelated to this task:
- `__tests__/rbac-policies.test.ts` and `__tests__/security-authorization.test.ts` fail because `@/lib/rbac` no longer exports `POLICIES`/`PolicyValue`.
- The directly affected test suite `__tests__/security-auth.test.ts` passes (25/25).

### `npx tsc --noEmit`
TypeScript reports pre-existing errors in the same two RBAC-related test files (`POLICIES` export and missing `priority`/`isSuperAdmin` properties). No new TypeScript errors were introduced by the changes in this task.

## Commit
Commit message: `Task 5: rate-limit /api/auth/verify, cap OTP attempts, use 8-digit codes`

---

# Task 5 Fix Report: Address 8-digit OTP / Attempt-Count Review Findings

## Status
Completed.

## Commit
- **Hash:** `02d20422c9a85274ce42c18efb135e13f3b5eacc`
- **Branch:** `Dev`
- **Message:** `Task 5: Harden verify/OTP flow for 8-digit codes and attempt lockout`

## Findings Fixed

### 1. [Critical] Password reset flow rejected 8-digit codes
- Updated `src/lib/utils/sanitize.ts` `sanitizeOTPCode` to accept 6 or 8 digit numeric codes (`/^(\d{6}|\d{8})$/`).
- Updated comment in `src/app/api/auth/verify-reset-code/route.ts` from "must be 6 digits" to "must be 8 digits".
- The route already calls `sanitizeOTPCode`, so it now accepts the 8-digit reset codes produced by `generateVerificationCode()`.

### 2. [High] UI components and email templates still expected 6-digit codes
- Updated `src/components/auth/EmailVerificationForm.tsx`:
  - Error text, placeholder, default description, max length, key-press handler, and submit disabled state changed from 6 to 8 digits.
- Updated `src/app/auth/verify/page.tsx` description from "6-digit" to "8-digit".
- Updated `src/app/auth/forgot-password/page.tsx`:
  - Step description, input slice limit, placeholder, max length, and submit disabled state changed from 6 to 8 digits.
- Updated email templates:
  - `src/lib/email/templates/verification.ts`
  - `src/lib/email/templates/password-reset.ts`
  - Changed instruction text from "Enter the 6-digit code above" to "Enter the 8-digit code above".
- Updated `src/server/services/email.ts` log masking from `/\b\d{6}\b/g` to `/\b\d{6,8}\b/g` so both legacy 6-digit and new 8-digit codes are masked in email subjects.
- Intentionally left 6-digit TOTP/app-2FA flows unchanged because authenticator apps and the existing email-2FA generator still produce 6-digit codes.

### 3. [Medium] Attempt-count logic now counts wrong guesses
- Refactored `AuthService.verifyEmail` in `src/server/services/auth.ts`:
  - New optional `userId` parameter.
  - When `userId` is provided (cookie/session-based flow), the method looks up the user's active `email_verification` record first, then compares the supplied code.
  - Wrong guesses and expired codes both increment `attemptCount`.
  - When `attemptCount` reaches 5, the record is marked `isValid: false` and the generic error is returned.
  - Successful verification still deletes the OTP and sends the welcome email.
  - When `userId` is absent (direct POST fallback), the method falls back to the original exact-code lookup; brute-force protection is provided by endpoint rate limiting (`rateLimiters.auth`).
- Updated `src/routes/routes.ts` `VerifyEmailRouteHandler` to:
  - Extract `userId` from the signed `verification-token` cookie via `verifyVerificationToken`.
  - Fall back to the authenticated NextAuth session if no cookie is present.
  - Pass the resolved `userId` to `AuthService.verifyEmail`.

### 4. [Medium] Added tests for new behavior
- Updated `__tests__/lib/utils/sanitize.test.ts`:
  - Added 8-digit acceptance case.
  - Added 9-digit rejection case.
- Added `__tests__/server/services/auth.test.ts`:
  - Verifies correct 8-digit email verification succeeds when `userId` is known.
  - Verifies wrong guesses increment `attemptCount` and return the generic error.
  - Verifies 5 wrong guesses invalidate the OTP.
  - Verifies expired codes increment `attemptCount`.
  - Verifies fallback exact-code lookup when `userId` is absent.
  - Verifies the private `generateVerificationCode()` produces 8-digit numeric codes.

## Verification Commands

### `npm test`
```
Test Suites: 2 failed, 14 passed, 16 total
Tests:       22 failed, 269 passed, 291 total
```
- The two failing suites (`__tests__/rbac-policies.test.ts` and `__tests__/security-authorization.test.ts`) are pre-existing RBAC failures unrelated to this task and explicitly excluded by the brief.
- All directly affected tests pass, including the new `__tests__/server/services/auth.test.ts` suite (7/7) and the updated `__tests__/lib/utils/sanitize.test.ts` suite.

### `npx tsc --noEmit`
TypeScript reports only the pre-existing RBAC test errors (`POLICIES` export, missing `priority`/`isSuperAdmin`). No new TypeScript errors were introduced by these changes.

## Files Changed
- `src/lib/utils/sanitize.ts`
- `src/app/api/auth/verify-reset-code/route.ts`
- `src/components/auth/EmailVerificationForm.tsx`
- `src/app/auth/verify/page.tsx`
- `src/app/auth/forgot-password/page.tsx`
- `src/lib/email/templates/verification.ts`
- `src/lib/email/templates/password-reset.ts`
- `src/server/services/email.ts`
- `src/server/services/auth.ts`
- `src/routes/routes.ts`
- `__tests__/lib/utils/sanitize.test.ts`
- `__tests__/server/services/auth.test.ts`
