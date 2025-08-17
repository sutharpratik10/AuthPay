// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";
import fs from "fs";
import path from "path";
import type { ConnectionOptions } from "tls"; // ✅ use proper TLS type

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) throw new Error("DATABASE_URL not set");

// Build SSL options for postgres.js without `any`
function pgSsl(): ConnectionOptions | boolean | undefined {
  const raw = process.env.DB_CERT_PATH ?? process.env.db_cert_path; // e.g., ssl/aiven-ca.pem
  if (raw) {
    const caPath = path.resolve(raw);
    if (fs.existsSync(caPath)) {
      const ca = fs.readFileSync(caPath, "utf8");
      // Strict verification (recommended once CA is correct)
      return { ca, rejectUnauthorized: true };
    } else {
      console.warn(`[db] CA not found at ${caPath}. Falling back to TLS without CA (dev only).`);
      return { rejectUnauthorized: false };
    }
  }

  // Optional: if you want TLS even without CA via env flag
  if ((process.env.DB_REQUIRE_SSL ?? "").toLowerCase() === "true") {
    return { rejectUnauthorized: false };
  }

  // No SSL (Aiven will reject this)
  return undefined;
}

const ssl = pgSsl();
const client = postgres(connectionString, {
  ...(ssl !== undefined ? { ssl } : {}), // ✅ don’t pass `undefined`
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 20),
  connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 10),
  prepare: false,
});

export const db = drizzle(client, { schema });
export { client as sql };
