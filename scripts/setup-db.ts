import { execSync } from 'child_process';
import path from 'path';

console.log("🚀 Starting database setup process...\n");

try {
  // 1. Create the database
  console.log("▶️ STEP 1: Initializing Database...");
  execSync('npx ts-node -P tsconfig.scripts.json scripts/create-database.ts', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log("\n");

  // 2. Run Migrations & Seed (Commented out by default to skip executing it)
  /*
  console.log("▶️ STEP 2: Running Drizzle Migrations and Seeding...");
  execSync('npx tsx scripts/migrate-and-seed.ts', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log("\n");
  */

  console.log("✅ Database setup successfully completed!");
} catch (error) {
  console.error("❌ Setup failed. Please check the logs above.");
  process.exit(1);
}
