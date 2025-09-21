// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";
import { getPostgresSSLConfig } from "./ssl-config";

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) throw new Error("DATABASE_URL not set");

// Get SSL configuration using shared utility
const ssl = getPostgresSSLConfig();
const client = postgres(connectionString, {
  ...(ssl !== undefined ? { ssl } : {}), // ✅ don’t pass `undefined`
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 20),
  connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 10),
  prepare: false,
});

export const db = drizzle(client, { schema });
export { client as sql };
