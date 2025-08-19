import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}
const u = new URL(process.env.DATABASE_URL);

let ssl: boolean | { ca: string; rejectUnauthorized: boolean } = false;

if (process.env.DB_USE_CA === "true" && process.env.DB_CERT_PATH) {
  const caPath = path.resolve(process.env.DB_CERT_PATH);
  if (fs.existsSync(caPath)) {
    ssl = {
      ca: fs.readFileSync(caPath, "utf8"),
      rejectUnauthorized: true,
    };
  }
} else if (process.env.DB_REQUIRE_SSL === "true") {
  ssl = true;
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