import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Parse DATABASE_URL for credentials
const databaseUrl = new URL(process.env.DATABASE_URL || 'postgres://localhost:5432/rsvp');

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
    ssl: databaseUrl.searchParams.get('sslmode') === 'require',
  },
  // Use a verbose flag for debugging
  verbose: true,
  // Use strict mode to enforce schema validation
  strict: true,
} satisfies Config;
