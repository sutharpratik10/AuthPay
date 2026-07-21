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

async function main() {
  console.log('Running migrations...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'src/server/db/migrations') });

  console.log('Migrations complete!');
  await sql.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});
