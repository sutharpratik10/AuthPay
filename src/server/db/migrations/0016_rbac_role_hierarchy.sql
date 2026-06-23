-- Add role hierarchy columns to roles table
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_super_admin" boolean DEFAULT false;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "priority" integer DEFAULT 0;

-- Add unique constraint on role_permissions to prevent duplicate role-permission assignments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_id_permission_id_unique'
  ) THEN
    ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_permission_id_unique" UNIQUE ("role_id", "permission_id");
  END IF;
END $$;
