import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;

// Optimize connection pool for better performance
const client = postgres(connectionString, {
  max: parseInt(process.env.DB_POOL_MAX || '10'), // Maximum connections in pool
  idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '20'), // Seconds to keep connection idle
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false, // Disable prepared statements for serverless compatibility
});

// For client-side usage (serverless)
export const db = drizzle(client, { schema });
