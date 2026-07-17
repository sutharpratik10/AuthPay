# AuthPay Test Strategy — Design Spec

**Date:** 2026-07-17
**Status:** Approved (design), pending implementation plan
**Approach:** Layered test pyramid built on the existing Jest setup

## 1. Purpose & Scope

A full QA strategy for the AuthPay application (Next.js 16, NextAuth v5, PostgreSQL + Drizzle, Razorpay/Stripe, policy-based RBAC, rate limiting / DDoS protection). The app already has ~15 Jest test files (security, rate limiter, auth, validation, RBAC) and `autocannon` available. This strategy extends that into four layers: unit, API integration, browser E2E, and load.

**Priority areas (all in scope):**

- Auth flows (register, login, email verify, password reset, passwordless, TOTP 2FA, sessions)
- Payments & billing (Razorpay + Stripe checkout, subscriptions, webhooks, refunds, free trial)
- RBAC & authorization (policy evaluation, role management, route/API protection)
- Rate limiting & load (limiter behavior, DDoS protection, autocannon scenarios)

**Decisions locked in:**

- Browser E2E via **Playwright** (new devDependency)
- Test data via **Dockerized ephemeral PostgreSQL**
- Deliverable is this spec, then an implementation plan, then implementation

## 2. Architecture & Tooling

Four test layers, each with its own runner config, sharing the Dockerized Postgres where needed:

| Layer | Runner | Target | DB / externals |
|---|---|---|---|
| Unit | Jest (existing config) | `src/server/services/*`, `src/lib/*`, config | Mocked DB, mocked gateways |
| API integration | Jest (separate project/config) | Route handlers in `src/app/api/**` invoked with `NextRequest` | Real ephemeral Postgres in Docker; gateways mocked at SDK boundary |
| E2E | Playwright (`e2e/`) | Critical browser journeys against `next start` | Same Docker DB; seeded users via storage state |
| Load | autocannon scripts (`scripts/load/`) | Local running instance | Same Docker DB; manual/nightly runs |

**npm scripts (additive — `npm test` keeps running unit tests only):**

- `test:unit` — Jest unit project
- `test:integration` — Jest integration project (spins Docker DB up/down)
- `test:e2e` — Playwright
- `test:load` — autocannon scenarios
- `test:clean` — force-remove test containers/volumes

**Layout:**

- `__tests__/` — unit tests (existing location, existing mocks kept)
- `__tests__/integration/` — API integration tests + integration setup/teardown
- `__tests__/mocks/` — extended with `razorpay.ts`, `stripe.ts`
- `e2e/` — Playwright tests, fixtures, storage states
- `scripts/load/` — autocannon scenario scripts
- `docker-compose.test.yml` — ephemeral Postgres
- `.env.test` — committed dummy test environment

Because the existing unit `jest.config.json` uses `testMatch: **/__tests__/**/*.test.ts`, it would also pick up `__tests__/integration/`. To keep `npm test` running unit tests only, the unit config gains `testPathIgnorePatterns` for `__tests__/integration/`; the integration project lives in its own `jest.config.integration.json` with its own `roots`, `globalSetup`/`globalTeardown`, and `.env.test` loading.

## 3. Coverage by Component

### 3.1 Auth flows

- **Unit:** auth service (register/login/lockout), TOTP service (setup, verify, recovery codes), session service, validation schemas, sanitize utils.
- **Integration:** the `/api/auth/*` surface — `register`, `verify`, `verify-reset-code`, `reset-password`, `change-password`, `validate-credentials`, `check-email`, `send-otp`, `passwordless/send`, `passwordless/verify`, `totp/setup`, `totp/verify-setup`, `totp/verify-login`, `totp/disable`, `totp/regenerate-recovery-codes`, `check-suspension`, `track-session`, plus NextAuth session/JWT callback behavior.
- **E2E:** register → email verify → login; login with TOTP 2FA; password reset via emailed link. OAuth covered through a mocked provider callback, not real Google/GitHub.

### 3.2 Payments & billing

- **Unit:** refund service (estimate/eligibility), subscription-plans service, webhook signature verification helpers.
- **Integration:** `razorpay-create-order`, `razorpay-webhook`, `stripe-create-session`, `stripe-webhook`, `stripe-verify`, subscription cancel (both gateways), `subscription-plans/purchase`, `free-trial/activate`, user + admin refunds endpoints, `gateway-config`. Webhooks tested with crafted signed payloads: valid, forged (bad signature), and replayed (idempotency).
- **Mocks:** `razorpay` and `stripe` SDKs mocked at the module boundary; no real gateway calls.
- **E2E:** one checkout happy path per gateway in test mode; subscription visible in user dashboard afterward.

### 3.3 RBAC & authorization

- **Unit:** permissions service (policy parsing/evaluation), rbac-types.
- **Integration:** `rbac/check-permission`, policies/roles CRUD (`/api/rbac/*`), admin role/permission assignment (`/api/admin/*`), middleware route protection via routeUtils. Negative cases: no session → 401, insufficient policy → 403, privilege-escalation attempts (user granting themselves admin, modifying another user's roles).
- **E2E:** admin creates role → assigns to user → user gains access; non-admin blocked from `/admin`.

### 3.4 Rate limiting & load

- **Unit:** keep existing rate-limiter suites; add window-boundary edge cases with fake timers.
- **Integration:** burst a rate-limited endpoint, assert 429 + rate-limit headers; run against a test-only limiter config (high defaults, one low-limit route) with limiter state reset between tests.
- **Load:** autocannon scenarios — login burst, API scrape, registration flood. Assert 429 responses appear as expected and the server stays healthy (p95 latency within agreed bound, no crashes).

## 4. Test Environment Lifecycle (Data Flow)

- `docker-compose.test.yml`: `postgres:16-alpine`, host port **5434** (avoids clashing with the dev DB), tmpfs-backed storage for speed, healthcheck enabled.
- **Integration lifecycle:** Jest `globalSetup` runs `docker compose -f docker-compose.test.yml up -d --wait`, applies schema via `drizzle-kit push`, runs `scripts/test-seed.ts`. `globalTeardown` runs `docker compose down -v`.
- **Seed data** (`scripts/test-seed.ts`): admin user, regular user, suspended user, 2FA-enabled user, roles + policies, subscription plans, sandbox gateway config.
- **Isolation between tests:** a `truncateAll()` helper resets tables between integration test files.
- **Config:** committed `.env.test` with dummy secrets; `razorpay`/`stripe` mapped to `__tests__/mocks/` via `moduleNameMapper` in the integration Jest config.
- **E2E lifecycle:** Playwright `webServer` boots `next start` pointed at the Docker DB; Playwright global setup seeds and saves authenticated storage states (admin, user) so tests skip UI login.
- **CI (optional follow-up):** GitHub Actions with parallel jobs — unit, integration (Docker available on runner), E2E (Playwright image); load as nightly/manual.

## 5. Error Handling, Flake Control, Harness Verification

- **Fail fast:** integration `globalSetup` checks Docker reachability and exits with a clear message if Docker isn't running; Playwright `webServer` has a boot timeout with captured logs.
- **Flake control:**
  - Rate-limiter unit tests use Jest fake timers.
  - Integration rate-limit tests use the dedicated test limiter config; state reset between tests.
  - Webhook signature tests use fixed timestamps/nonces → deterministic payloads.
  - Playwright: 1 retry locally, 2 in CI; trace + screenshot on failure.
- **Harness self-check:** a smoke test asserts the seed worked (expected users/roles/plans exist) so environment problems surface as one clear failure instead of many cryptic ones.
- **Coverage gates:** Jest thresholds for `src/server/services/` and `src/lib/` starting at 70% (lines/functions), ratcheted up in later iterations.
- **Cleanup:** teardown always runs `down -v`; `test:clean` script force-removes stuck test containers/volumes.

## 6. Risks & Open Notes

- **Docker availability** is a hard prerequisite for integration/E2E/load layers; unit tests remain runnable without it.
- **Payment gateway test mode** for the E2E checkout happy path requires real test keys; if unavailable, that single E2E journey falls back to the mocked SDK path (integration coverage is unaffected).
- Existing `jest.config-fixed.json` suggests prior Jest config trouble; integration config will be added as a separate file rather than disturbing the working unit config.
- Load tests are not gating; they run manually/nightly and report, not block.

## 7. Success Criteria

- `npm run test:unit`, `test:integration`, `test:e2e`, `test:load` each run green locally from a clean checkout (given Docker).
- Coverage gates met for services/lib.
- All four priority areas have executable tests at the layers listed in Section 3.
- No real external calls (payment gateways, email, OAuth providers) in any automated layer.
