import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import { getDrizzleSSLConfig } from "./src/db/ssl-config";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}
const u = new URL(process.env.DATABASE_URL);

// Get SSL configuration using shared utility
const ssl = getDrizzleSSLConfig();

// Debug logging for SSL configuration (only in development)
if (process.env.NODE_ENV === "development" || process.env.DEBUG_DB === "true") {
  const sslMode = u.searchParams.get("sslmode") || process.env.DB_SSLMODE || "prefer";
  console.log(`[Drizzle Config] SSL Mode: ${sslMode}`);
  console.log(`[Drizzle Config] SSL Config:`, typeof ssl === "boolean" ? ssl : { ...ssl, ca: ssl.ca ? "[CERTIFICATE LOADED]" : undefined });
}

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
    ssl, // always set, either false, true, or object
  },
  verbose: true,
  strict: true,
} satisfies Config;