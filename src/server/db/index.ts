// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";
import { getPostgresSSLConfig } from "./ssl-config";

const connectionString = process.env.DATABASE_URL!;

// Allow build to proceed without DATABASE_URL
if (!connectionString) {
  console.warn("DATABASE_URL not set - using placeholder for build");
}

// Get SSL configuration using shared utility
const ssl = connectionString ? getPostgresSSLConfig() : undefined;
const client = connectionString
  ? postgres(connectionString, {
      ...(ssl !== undefined ? { ssl } : {}), // ✅ don't pass `undefined`
      max: Number(process.env.DB_POOL_MAX ?? 50),
      idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 20),
      connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 10),
      prepare: false,
    })
  : (null as any); // Will fail at runtime if used without DATABASE_URL

export const db = client ? drizzle(client, { schema }) : (null as any);
export { client as sql };
