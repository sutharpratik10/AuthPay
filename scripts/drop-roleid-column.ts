/**
 * Migration Script: Drop role_id column from users table
 * 
 * This script removes the legacy role_id column from the users table
 * since we're now using the user_roles many-to-many relationship table
 * for policy-based RBAC.
 * 
 * Run: npx tsx scripts/drop-roleid-column.ts
 */

import { db } from "../src/server/db";
import { sql } from "drizzle-orm";

async function dropRoleIdColumn() {
  try {
    console.log("🔧 Starting migration: Drop role_id column from users table...");

    // Check if the column exists before trying to drop it
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name = 'role_id'
    `);

    if (!columnCheck || columnCheck.length === 0) {
      console.log("✅ Column role_id doesn't exist in users table. No migration needed.");
      return;
    }

    console.log("📋 Found role_id column. Proceeding with migration...");

    // Step 1: Drop the foreign key constraint if it exists
    console.log("1️⃣ Dropping foreign key constraint (if exists)...");
    await db.execute(sql`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_id_roles_id_fk
    `);
    console.log("   ✅ Foreign key constraint dropped (or didn't exist)");

    // Step 2: Drop the role_id column
    console.log("2️⃣ Dropping role_id column...");
    await db.execute(sql`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS role_id
    `);
    console.log("   ✅ Column role_id dropped successfully");

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📝 Summary:");
    console.log("   - Removed role_id foreign key constraint");
    console.log("   - Removed role_id column from users table");
    console.log("   - System now uses user_roles table exclusively for RBAC");
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration
dropRoleIdColumn()
  .then(() => {
    console.log("\n✨ Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
