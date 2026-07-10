import re
import os

file_path = "d:\\Pratik\\Dev\\Projects\\AuthPay\\SECURITY-AUDIT-REPORT.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update Table 1: Files Reviewed count
content = re.sub(r"\| \*\*Files Reviewed\*\* \| 2 \|", "| **Files Reviewed** | 29 |", content)

# Update Executive Summary Counts
content = re.sub(r"\| 🔴 Critical \| 4 \|", "| 🔴 Critical | 5 |", content)
content = re.sub(r"\| 🟠 High \| 5 \|", "| 🟠 High | 7 |", content)
content = re.sub(r"\| 🟡 Medium \| 7 \|", "| 🟡 Medium | 11 |", content)
# Low and Info are unchanged

# Update Audit Progress Table
content = re.sub(r"- \[ \] `src/app/api/auth/validate-credentials/` — Credential validation", "- [✓] `src/app/api/auth/validate-credentials/` — Credential validation", content)
content = re.sub(r"- \[ \] `src/app/api/auth/forgot-password/` — Password reset initiation", "- [✓] `src/app/api/auth/forgot-password/` — Password reset initiation", content)
content = re.sub(r"- \[ \] `src/app/api/auth/reset-password/` — Password reset execution", "- [✓] `src/app/api/auth/reset-password/` — Password reset execution", content)
content = re.sub(r"- \[ \] `src/app/api/auth/verify-reset-code/` — Reset code verification", "- [✓] `src/app/api/auth/verify-reset-code/` — Reset code verification", content)
content = re.sub(r"- \[ \] `src/app/api/auth/verify-2fa/` — 2FA verification", "- [✓] `src/app/api/auth/verify-2fa/` — 2FA verification", content)
content = re.sub(r"- \[ \] `src/app/api/auth/send-otp/` — OTP sending", "- [✓] `src/app/api/auth/send-otp/` — OTP sending", content)
content = re.sub(r"- \[ \] `src/app/api/auth/passwordless/` — Passwordless login", "- [✓] `src/app/api/auth/passwordless/` — Passwordless login", content)
content = re.sub(r"- \[ \] `src/app/api/admin/\*` — All admin API routes \(12 routes\)", "- [✓] `src/app/api/admin/*` — All admin API routes (12 routes)", content)

new_findings = """
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

"""

# Insert new findings before `# Cross-File Observations`
content = content.replace("# Cross-File Observations", new_findings + "\n# Cross-File Observations")

# Update Cross-File Observations
cross_file_updates = """
### Shared Vulnerabilities
- **Rate Limiting Inconsistency**: While some routes (`forgot-password`, `verify-2fa`) strictly apply `rateLimiters.auth`, others like `passwordless` completely omit it, creating massive blind spots for brute-forcing.
- **Authentication Flow Flaws**: The `skipPasswordCheck` parameter discovered earlier is actively supplied *by the backend* to the frontend in the 2FA and passwordless verify routes. This represents a complete architectural breakdown of trust boundaries.
"""
content = content.replace("### OAuth Flow", cross_file_updates + "\n### OAuth Flow")

# Update Production Readiness Checklist
content = content.replace("| Passwordless Login | 🔴 FAIL | Returns skipPasswordCheck to client (AUTH-01) |", "| Passwordless Login | 🔴 FAIL | Returns skipPasswordCheck, missing rate limits (AUTH-13, AUTH-14) |")
content = content.replace("| TOTP / 2FA | 🔴 FAIL | Bypassable (AUTH-03), Replay attacks possible (AUTH-33) |", "| TOTP / 2FA | 🔴 FAIL | Bypassable (AUTH-03), Exposes bypass params (AUTH-12) |")

# Update Recommendations
new_recs = """
4. **Enforce Rate Limits on Passwordless APIs** — Add `rateLimiters.auth` to prevent trivial OTP brute-forcing and mass account creation. (AUTH-13, AUTH-14)
"""
content = content.replace("### 🟡 Short-Term Improvements (Fix within first sprint)", "### 🟡 Short-Term Improvements (Fix within first sprint)\n" + new_recs)

# Update Final Security Score table
content = re.sub(r"\| 🔴 Critical \| 17 \|", "| 🔴 Critical | 18 |", content)
content = re.sub(r"\| 🟠 High \| 24 \|", "| 🟠 High | 26 |", content)
content = re.sub(r"\| 🟡 Medium \| 19 \|", "| 🟡 Medium | 23 |", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Update completed.")
