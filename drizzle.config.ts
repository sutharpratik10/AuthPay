import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables early
dotenv.config();

// Decide SSL strictly based on env and cert availability
let ssl: boolean | { ca: string; rejectUnauthorized: boolean } = false;

const useCustomCa = process.env.DB_USE_CA === 'true';
const dbCertPath = process.env.DB_CERT_PATH || process.env.db_cert_path;
const requireSsl =
  process.env.DB_REQUIRE_SSL === 'true' ||
  /[?&]sslmode=require\b/i.test(process.env.DATABASE_URL || '');

if (useCustomCa && dbCertPath && fs.existsSync(dbCertPath)) {
  // Use custom CA bundle when provided
  ssl = {
    ca: fs.readFileSync(dbCertPath, 'utf8'),
    // Set to true if your CA is trusted and you want strict verification
    rejectUnauthorized: false,
  };
} else if (requireSsl) {
  // Provider requires SSL but no custom CA provided
  ssl = true;
} else {
  // Default: no SSL (e.g., local dev)
  ssl = false;
}

// Parse DATABASE_URL for credentials
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}
const databaseUrl = new URL(process.env.DATABASE_URL);

// Drizzle configuration
export default {
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port) || 5432,
    user: databaseUrl.username,
    password: databaseUrl.password,
    database: databaseUrl.pathname.substring(1), // Remove leading '/'
    ssl,
  },
  // Use a verbose flag for debugging
  verbose: true,
  // Use strict mode to enforce schema validation
  strict: true,
} satisfies Config;
