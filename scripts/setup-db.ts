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

  // 2. Run Migrations
  console.log("▶️ STEP 2: Running Drizzle Migrations...");
  execSync('npm run db:migrate', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log("\n");

  // 3. Seed Database
  console.log("▶️ STEP 3: Seeding Database...");
  execSync('npm run db:seed', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log("\n");

  console.log("✅ Database setup successfully completed!");
} catch (error) {
  console.error("❌ Setup failed. Please check the logs above.");
  process.exit(1);
}
