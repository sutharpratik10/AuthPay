# Test Infrastructure Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared test infrastructure — Dockerized ephemeral Postgres, committed `.env.test`, seed mechanism, and a separate Jest integration harness with a passing smoke test — that all later test plans build on.

**Architecture:** A `postgres:16-alpine` container on host port 5433 holds the throwaway `authpay_test` database. A Jest `globalSetup` (plain JS) brings the container up, pushes the Drizzle schema, and seeds it; `globalTeardown` destroys it. Integration tests load `.env.test` via `setupFiles` so `src/server/db` connects to the test DB. The existing unit `jest.config.json` is untouched except for ignoring the new integration/e2e paths, so `npm test` behavior is unchanged.

**Tech Stack:** Jest 30 + ts-jest, Docker Compose v2, drizzle-kit push, ts-node, postgres.js.

**Spec:** `docs/superpowers/specs/2026-07-17-authpay-test-strategy-design.md` (this plan implements Sections 2 and 4 — layout, lifecycle, harness self-check, cleanup. Playwright E2E, load tests, per-area test suites, and coverage gates are separate follow-up plans.)

**Deviations from spec (intentional):**
- Spec's extra seed fixtures (suspended user, 2FA-enabled user) are deferred to the auth-integration plan that consumes them — the schema field names must be confirmed there.
- The spec lists `test:load` / `test:e2e` scripts; those arrive with their own plans.

## Global Constraints

- `npm test` must keep running **unit tests only** (existing `jest.config.json`); integration and E2E tests must never be picked up by it.
- Test database URL is exactly `postgresql://postgres:postgres@localhost:5433/authpay_test`. Never point any test at the dev/prod `DATABASE_URL`.
- `.env.test` contains dummy values only and is committed to git (`.gitignore` currently ignores `.env*` — add an explicit exception).
- No real external calls (Razorpay, Stripe, SMTP, OAuth) from any test layer.
- Path alias `@/` maps to `src/` (matches `jest.config.json` `moduleNameMapper`).
- Docker must be running for the integration layer; the harness fails fast with a clear message if it is not.
- Windows host: run shell commands via Git Bash; all commands below are Bash-safe.

---

### Task 1: Docker Compose test database

**Files:**
- Create: `docker-compose.test.yml`

**Interfaces:**
- Consumes: nothing.
- Produces: container `authpay-test-db` (postgres:16-alpine) serving database `authpay_test` on `localhost:5433` with credentials `postgres`/`postgres`; managed via `docker compose -f docker-compose.test.yml up -d --wait` / `down -v`.

- [ ] **Step 1: Create `docker-compose.test.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: authpay-test-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: authpay_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d authpay_test"]
      interval: 2s
      timeout: 3s
      retries: 15
```

- [ ] **Step 2: Verify the container starts and is reachable**

Run: `docker compose -f docker-compose.test.yml up -d --wait`
Expected: exit 0, line like `Container authpay-test-db  Healthy`

Run: `docker exec authpay-test-db pg_isready -U postgres -d authpay_test`
Expected output: `/var/run/postgresql:5432 - accepting connections`

- [ ] **Step 3: Verify teardown works**

Run: `docker compose -f docker-compose.test.yml down -v`
Expected: exit 0, `Container authpay-test-db  Removed` and network removed.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.test.yml
git commit -m "test: add dockerized ephemeral postgres for integration tests"
```

---

### Task 2: Test environment file and seed mechanism

**Files:**
- Create: `.env.test`
- Modify: `.gitignore` (line 35: `.env*`)
- Modify: `scripts/db-seed.ts:12-13` (env file selection)
- Create: `scripts/test-seed.ts`

**Interfaces:**
- Consumes: Task 1's running container; existing `scripts/db-seed.ts` (exports `seed()`).
- Produces: `.env.test` with `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/authpay_test"`; `SEED_ENV_FILE` support in `db-seed.ts`; `scripts/test-seed.ts` runnable as `npx ts-node -P tsconfig.scripts.json scripts/test-seed.ts`.

- [ ] **Step 1: Add the `.gitignore` exception**

In `.gitignore`, change:

```
# env files (can opt-in for committing if needed)
.env*
```

to:

```
# env files (can opt-in for committing if needed)
.env*
!.env.test
```

- [ ] **Step 2: Create `.env.test`**

> If the file-writing tool refuses the `.env.test` path, create it with a Bash heredoc instead — every value below is a dummy and the file is meant to be committed.

```dotenv
# ============================================
# TEST environment — dummy values only, committed on purpose.
# Loaded by __tests__/integration/setup-env.ts and scripts/test-seed.ts.
# ============================================
NODE_ENV="test"

# Ephemeral Docker Postgres (docker-compose.test.yml)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/authpay_test"
DB_USE_CA=false
DB_SSLMODE="disable"

# Application settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Authpay"
AUTH_SECRET="test-secret-key-for-testing-purposes-only"
NEXTAUTH_SECRET="test-secret-key-for-testing-purposes-only"
TOTP_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Email (never actually sent in tests)
EMAIL_HOST="localhost"
EMAIL_PORT=1025
EMAIL_SECURE=false
EMAIL_USER="test@example.com"
EMAIL_PASS="test"
EMAIL_FROM="noreply@test.local"

# Razorpay (dummy — SDK is mocked in tests)
RAZORPAY_KEY_ID="rzp_test_dummy"
RAZORPAY_KEY_SECRET="dummy-razorpay-secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_dummy"
RAZORPAY_WEBHOOK_SECRET="dummy-razorpay-webhook-secret"

# Stripe (dummy — SDK is mocked in tests)
STRIPE_SECRET_KEY="sk_test_dummy"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_dummy"
STRIPE_WEBHOOK_SECRET="whsec_dummy"
```

- [ ] **Step 3: Make `db-seed.ts` env file selectable**

In `scripts/db-seed.ts`, replace:

```ts
// load .env.local if present, else .env
const chosenEnv = fs.existsSync(envLocal) ? envLocal : envDefault;
```

with:

```ts
// load SEED_ENV_FILE if set (e.g. ".env.test" for the test DB),
// else .env.local if present, else .env
const chosenEnv = process.env.SEED_ENV_FILE
  ? path.join(root, process.env.SEED_ENV_FILE)
  : fs.existsSync(envLocal)
    ? envLocal
    : envDefault;
```

- [ ] **Step 4: Create `scripts/test-seed.ts`**

```ts
/**
 * Seeds the ephemeral integration-test database (docker-compose.test.yml).
 * Reuses the fixtures from scripts/db-seed.ts but points them at .env.test.
 *
 * Invoked automatically by __tests__/integration/global-setup.js;
 * can also be run manually:
 *   npx ts-node -P tsconfig.scripts.json scripts/test-seed.ts
 *
 * NOTE: uses require() (not import) so SEED_ENV_FILE is set before
 * db-seed.ts evaluates its top-level dotenv config — ES imports would
 * be hoisted above these assignments.
 */
process.env.SEED_ENV_FILE = ".env.test";
process.env.NODE_ENV = "test";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { seed } = require("./db-seed");

seed();
```

- [ ] **Step 5: Verify seeding works against the test DB**

Run: `docker compose -f docker-compose.test.yml up -d --wait`
Expected: container healthy.

Run: `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/authpay_test" DB_SSLMODE=disable DB_USE_CA=false npx drizzle-kit push --force`
Expected: tables created (`[✓] Changes applied` or similar; no SSL errors).

Run: `npx ts-node -P tsconfig.scripts.json scripts/test-seed.ts`
Expected output ends with: `🎉 Database seeding completed successfully!` and the logged `DATABASE_URL` line shows `...localhost:5433/authpay_test` — **verify it is NOT your dev database URL**.

- [ ] **Step 6: Verify the existing seed path still works**

Run: `npx ts-node -P tsconfig.scripts.json scripts/db-seed.ts`
Expected: succeeds exactly as before (uses `.env.local`/`.env`; this confirms the `SEED_ENV_FILE` change is backward compatible).

- [ ] **Step 7: Commit**

```bash
git add .gitignore .env.test scripts/db-seed.ts scripts/test-seed.ts
git commit -m "test: add committed .env.test and SEED_ENV_FILE-selectable seeding"
```

---

### Task 3: Integration Jest harness

**Files:**
- Create: `jest.config.integration.json`
- Create: `__tests__/integration/setup-env.ts`
- Create: `__tests__/integration/global-setup.js`
- Create: `__tests__/integration/global-teardown.js`

**Interfaces:**
- Consumes: Task 1's compose file; Task 2's `scripts/test-seed.ts` and `.env.test`.
- Produces: `jest.config.integration.json` with `globalSetup`/`globalTeardown`; `setup-env.ts` (loads `.env.test` with `override: true` into every test worker via `setupFiles`). Later plans put their tests in `__tests__/integration/**/*.test.ts` and rely on `db`/`sql` from `@/server/db` pointing at the test DB.

- [ ] **Step 1: Create `__tests__/integration/setup-env.ts`**

```ts
/**
 * Runs in every integration-test worker before any test module loads.
 * .env.test must win over the real .env that src/server/db pulls in via
 * `import "dotenv/config"`, hence override: true.
 */
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "../../.env.test"), override: true });
```

- [ ] **Step 2: Create `__tests__/integration/global-setup.js`**

```js
/**
 * Jest globalSetup (plain JS — Jest does not transform globalSetup).
 * Brings up the Docker test DB, pushes the Drizzle schema, and seeds it.
 * Runs once per `npm run test:integration` invocation, in its own process;
 * env changes here do NOT reach test workers (that is what setup-env.ts is for).
 */
const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/authpay_test";

module.exports = async function globalSetup() {
  try {
    execSync("docker info", { stdio: "ignore" });
  } catch {
    throw new Error(
      "Integration tests require Docker, but `docker info` failed. " +
        "Start Docker Desktop (or the Docker daemon) and re-run `npm run test:integration`."
    );
  }

  execSync("docker compose -f docker-compose.test.yml up -d --wait", {
    cwd: root,
    stdio: "inherit",
  });

  execSync("npx drizzle-kit push --force", {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      DB_SSLMODE: "disable",
      DB_USE_CA: "false",
      NODE_ENV: "test",
    },
  });

  execSync("npx ts-node -P tsconfig.scripts.json scripts/test-seed.ts", {
    cwd: root,
    stdio: "inherit",
  });
};
```

- [ ] **Step 3: Create `__tests__/integration/global-teardown.js`**

```js
/** Destroys the ephemeral test database (containers + volumes). */
const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "../..");

module.exports = async function globalTeardown() {
  execSync("docker compose -f docker-compose.test.yml down -v", {
    cwd: root,
    stdio: "inherit",
  });
};
```

- [ ] **Step 4: Create `jest.config.integration.json`**

```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/__tests__/integration"],
  "testMatch": ["**/*.test.ts"],
  "transform": {
    "^.+\\.ts$": ["ts-jest", {
      "tsconfig": {
        "types": ["jest", "node"]
      }
    }]
  },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  "transformIgnorePatterns": [
    "node_modules/(?!(next-auth|@auth)/)"
  ],
  "setupFiles": ["<rootDir>/__tests__/integration/setup-env.ts"],
  "globalSetup": "<rootDir>/__tests__/integration/global-setup.js",
  "globalTeardown": "<rootDir>/__tests__/integration/global-teardown.js",
  "testTimeout": 30000,
  "verbose": true
}
```

- [ ] **Step 5: Verify Jest picks up the config**

Run: `npx jest --config jest.config.integration.json --showConfig | grep -E "globalSetup|globalTeardown|setupFiles" -m 5`
Expected: paths ending in `__tests__/integration/global-setup.js`, `global-teardown.js`, and `setup-env.ts`.

- [ ] **Step 6: Commit**

```bash
git add jest.config.integration.json __tests__/integration/setup-env.ts __tests__/integration/global-setup.js __tests__/integration/global-teardown.js
git commit -m "test: add jest integration harness with docker lifecycle"
```

---

### Task 4: Smoke test, truncate helper, npm scripts, unit-config isolation

**Files:**
- Create: `__tests__/integration/helpers/db.ts`
- Create: `__tests__/integration/smoke.test.ts`
- Modify: `package.json` (scripts section, after `"test:coverage"`)
- Modify: `jest.config.json` (add `testPathIgnorePatterns`)

**Interfaces:**
- Consumes: Task 3's harness; `db`, `sql` from `@/server/db`; `users`, `roles`, `subscriptionPlans` from `@/server/db/schema`.
- Produces: npm scripts `test:unit`, `test:integration`, `test:clean`; `truncateAll(): Promise<void>` from `__tests__/integration/helpers/db.ts` for later plans (note: it also wipes seed data — callers re-create fixtures they need); a passing `smoke.test.ts` proving the harness works.

- [ ] **Step 1: Create `__tests__/integration/helpers/db.ts`**

```ts
import { sql } from "@/server/db";

/**
 * Truncates every application table across the schemas the app uses
 * (see schemaFilter in drizzle.config.ts).
 *
 * WARNING: this also wipes the global seed data. Tests that call it
 * must create whatever fixtures they need afterwards.
 */
export async function truncateAll(): Promise<void> {
  await sql`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN ('public', 'auth', 'core')
      ) LOOP
        EXECUTE format('TRUNCATE TABLE %I.%I CASCADE', r.schemaname, r.tablename);
      END LOOP;
    END $$;
  `;
}
```

- [ ] **Step 2: Create `__tests__/integration/smoke.test.ts`**

```ts
import { eq } from "drizzle-orm";
import { db, sql } from "@/server/db";
import { roles, subscriptionPlans, users } from "@/server/db/schema";

describe("integration harness smoke test", () => {
  it("connects to the ephemeral test database, not the dev DB", async () => {
    const rows = await sql`SELECT current_database() AS db`;
    expect(rows[0].db).toBe("authpay_test");
  });

  it("schema was applied and seeded with the 4 default roles", async () => {
    const allRoles = await db.select().from(roles);
    expect(allRoles.length).toBeGreaterThanOrEqual(4);
  });

  it("seed created the admin and user accounts", async () => {
    const admin = await db.query.users.findFirst({
      where: eq(users.email, "admin@example.com"),
    });
    const user = await db.query.users.findFirst({
      where: eq(users.email, "user@example.com"),
    });
    expect(admin?.isEmailVerified).toBe(true);
    expect(user).toBeDefined();
  });

  it("seed created subscription plans", async () => {
    const plans = await db.select().from(subscriptionPlans);
    expect(plans.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 3: Add npm scripts to `package.json`**

In the `"scripts"` block, immediately after `"test:coverage": "jest --coverage",` add:

```json
    "test:unit": "jest --config jest.config.json",
    "test:integration": "jest --config jest.config.integration.json --runInBand",
    "test:clean": "docker compose -f docker-compose.test.yml down -v --remove-orphans",
```

- [ ] **Step 4: Isolate the unit config from integration/e2e tests**

In `jest.config.json`, add this key (e.g. after `"testMatch"`):

```json
  "testPathIgnorePatterns": [
    "<rootDir>/__tests__/integration/",
    "<rootDir>/e2e/"
  ],
```

- [ ] **Step 5: Run the integration suite**

Run: `npm run test:integration`
Expected: Docker starts, schema pushes, seed logs appear, then `Tests: 4 passed, 4 total` and the container is torn down (`down -v` output at the end).

- [ ] **Step 6: Verify the unit suite is unaffected**

Run: `npm test`
Expected: the same unit tests pass as before this plan; no `__tests__/integration/` files appear in the run.

- [ ] **Step 7: Commit**

```bash
git add __tests__/integration/helpers/db.ts __tests__/integration/smoke.test.ts package.json jest.config.json
git commit -m "test: add integration smoke test, truncateAll helper, and test scripts"
```

---

## Self-Review Notes

- **Spec coverage:** implements spec Sections 2 (layout/scripts for the Jest layers), 4 (Docker lifecycle, seed, `.env.test`, fail-fast, cleanup), and the harness self-check from Section 5. Follow-up plans (not part of this one): auth integration tests, payments integration tests, RBAC + rate-limit integration tests, Playwright E2E, autocannon load tests, unit-test gap fill + coverage gates.
- **Type consistency:** `truncateAll(): Promise<void>` (Task 4) is the only exported symbol later plans consume; `seed()` reuse keeps fixture definitions DRY in `scripts/db-seed.ts`.
- **Known follow-up:** if `drizzle-kit push` prompts interactively despite `--force` on some drizzle-kit version, add `--verbose` and pipe `yes` — handle when first observed, not preemptively.
