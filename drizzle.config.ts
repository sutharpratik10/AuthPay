// drizzle.config.ts
import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

type DrizzleSsl = boolean | { ca: string; rejectUnauthorized: boolean };

function drizzleSsl(): DrizzleSsl | undefined {
  const useCustomCa =
    (process.env.DB_USE_CA ?? process.env.db_use_ca) === "true";
  const raw = process.env.DB_CERT_PATH ?? process.env.db_cert_path;
  const url = process.env.DATABASE_URL || "";

  if (useCustomCa && raw) {
    const caPath = path.resolve(raw);
    if (fs.existsSync(caPath)) {
      return {
        ca: fs.readFileSync(caPath, "utf8"),
        // flip to true only when your CA chain is correct; shown here as true already
        rejectUnauthorized: true,
      };
    }
  }

  const requireSsl =
    process.env.DB_REQUIRE_SSL === "true" ||
    /(?:^|[?&])sslmode=(?:require|enabled|verify-ca|verify-full)\b/i.test(url);

  return requireSsl ? true : undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}
const u = new URL(process.env.DATABASE_URL);

const ssl = drizzleSsl();

export default {
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: u.hostname,
    port: Number(u.port) || 5432,
    user: u.username,
    password: u.password,
    database: u.pathname.slice(1),
    ...(ssl !== undefined ? { ssl } : {}), // ✅ no `as any`
  },
  verbose: true,
  strict: true,
} satisfies Config;
