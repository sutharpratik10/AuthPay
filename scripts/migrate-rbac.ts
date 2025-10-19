/**
 * Database Migration Script for RBAC System
 * 
 * This script creates the user_roles table and updates the permissions table
 * to support the new policy-based RBAC system.
 * 
 * Run this script after updating your schema.ts file.
 */

import { db } from "@/server/db";
import { sql } from "drizzle-orm";

async function migrateRBAC() {
  console.log("🚀 Starting RBAC Migration...\n");

  try {
    // Step 1: Create user_roles table if it doesn't exist
    console.log("📋 Creating user_roles table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "assigned_at" timestamp DEFAULT now() NOT NULL,
        "assigned_by" uuid,
        CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "user_roles_user_id_role_id_unique" UNIQUE ("user_id", "role_id")
      );
    `);
    console.log("✅ user_roles table created\n");

    // Step 2: Add new columns to permissions table if they don't exist
    console.log("📋 Updating permissions table...");
    
    // Add resource column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'permissions' AND column_name = 'resource'
        ) THEN
          ALTER TABLE "permissions" ADD COLUMN "resource" varchar(100);
          UPDATE "permissions" SET "resource" = split_part("name", ':', 1) WHERE "name" LIKE '%:%';
        END IF;
      END $$;
    `);

    // Add action column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'permissions' AND column_name = 'action'
        ) THEN
          ALTER TABLE "permissions" ADD COLUMN "action" varchar(50);
          UPDATE "permissions" SET "action" = split_part("name", ':', 2) WHERE "name" LIKE '%:%';
        END IF;
      END $$;
    `);
    console.log("✅ permissions table updated\n");

    // Step 3: Migrate existing users.roleId to user_roles (optional)
    console.log("📋 Migrating existing user roles...");
    await db.execute(sql`
      INSERT INTO "user_roles" ("user_id", "role_id", "assigned_at")
      SELECT "id", "role_id", "created_at"
      FROM "users"
      WHERE "role_id" IS NOT NULL
      ON CONFLICT ("user_id", "role_id") DO NOTHING;
    `);
    console.log("✅ Existing user roles migrated\n");

    // Step 4: Create indexes for performance
    console.log("📋 Creating indexes...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id" ON "user_roles"("user_id");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_user_roles_role_id" ON "user_roles"("role_id");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_permissions_resource_action" ON "permissions"("resource", "action");
    `);
    console.log("✅ Indexes created\n");

    console.log("🎉 RBAC Migration completed successfully!\n");
    console.log("📝 Summary:");
    console.log("  ✓ user_roles table created");
    console.log("  ✓ permissions table updated with resource/action columns");
    console.log("  ✓ Existing user roles migrated");
    console.log("  ✓ Performance indexes created");
    console.log("\n✨ Your RBAC system is ready to use!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrateRBAC()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrateRBAC };
