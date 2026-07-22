import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

import fs from 'fs';
const root = path.resolve(process.cwd());
const envLocal = path.join(root, '.env.local');
const envDefault = path.join(root, '.env');
const chosenEnv = fs.existsSync(envLocal) ? envLocal : envDefault;
dotenv.config({ path: chosenEnv, override: true });

import { getPostgresSSLConfig } from '../src/server/db/ssl-config';

async function main() {
  console.log('Running migrations...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const ssl = getPostgresSSLConfig();
  const sql = postgres(process.env.DATABASE_URL, { 
    max: 1,
    ...(ssl !== undefined ? { ssl } : {})
  });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'src/server/db/migrations') });

  console.log('Migrations complete!');
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  
  // Safely ignore if tables/schema already exist (e.g. from hash mismatches on Vercel)
  if (err && err.cause && err.cause.message && err.cause.message.includes('already exists')) {
    console.log('Ignored: Schema or relation already exists.');
    process.exit(0);
  }
  
  process.exit(1);
});
