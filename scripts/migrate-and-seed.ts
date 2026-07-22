import { execSync } from 'child_process';
import path from 'path';

console.log("🚀 Starting migrations and seed process...\n");

try {
  // 1. Run Migrations
  console.log("▶️ Running Drizzle Migrations...");
  execSync('npm run db:migrate', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log("\n");

  // 2. Seed Database
  console.log("▶️ Seeding Database...");
  execSync('npm run db:seed', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log("\n");

  console.log("✅ Migrations and seed completed!");
} catch (error) {
  console.error("❌ Process failed. Please check the logs above.");
  process.exit(1);
}
