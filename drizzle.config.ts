import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

let ssl: boolean | { ca: string; rejectUnauthorized: boolean } = true; // default to basic SSL

const useCustomCa = process.env.DB_USE_CA === 'true';
const dbCertPath = process.env.db_cert_path;
if (useCustomCa && dbCertPath && fs.existsSync(dbCertPath)) {
  ssl = {
    ca: fs.readFileSync(dbCertPath, 'utf8'),
    rejectUnauthorized: false,
  };
} else {
  ssl = {
    ca: '',
    rejectUnauthorized: false,
  };
}
// Load environment variables
dotenv.config();

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
