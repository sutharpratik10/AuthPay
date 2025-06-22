import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// For migrations
async function main() {
  console.log('Running migrations...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  // Connect to the database
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);
  
  // Run migrations
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  
  console.log('Migrations complete!');
  await sql.end();
  process.exit(0);
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
