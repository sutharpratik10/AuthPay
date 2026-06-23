import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function main() {
  console.log('Running manual RBAC migration...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  const sqlPath = path.join(process.cwd(), 'src/server/db/migrations/0016_rbac_role_hierarchy.sql');
  const sqlString = fs.readFileSync(sqlPath, 'utf8');

  try {
    await sql.unsafe(sqlString);
    console.log('RBAC manual migration executed successfully!');
  } catch (error) {
    console.error('Error executing manual SQL:', error);
  }

  await sql.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});
