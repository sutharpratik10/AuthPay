import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For client-side usage (serverless)
export const db = drizzle(postgres(connectionString), { schema });
