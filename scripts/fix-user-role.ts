/**
 * Fix test user role assignment
 * Updates user from old 'user' role to new 'User' role
 */

import { db } from "../src/server/db";
import { userRoles, roles } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

async function fixUserRole() {
  console.log("🔧 Fixing user role assignment...\n");

  // Find the test user
  const testUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, 'user@example.com'),
    columns: { id: true, email: true }
  });

  if (!testUser) {
    console.log("❌ Test user not found");
    return;
  }

  console.log(`✓ Found user: ${testUser.email}`);

  // Find the new 'User' role (capital U)
  const newUserRole = await db.query.roles.findFirst({
    where: eq(roles.name, 'User'),
    columns: { id: true, name: true }
  });

  if (!newUserRole) {
    console.log("❌ 'User' role not found");
    return;
  }

  console.log(`✓ Found role: ${newUserRole.name}`);

  // Delete old role assignments
  await db.delete(userRoles).where(eq(userRoles.userId, testUser.id));
  console.log("✓ Removed old role assignment");

  // Assign new role
  await db.insert(userRoles).values({
    userId: testUser.id,
    roleId: newUserRole.id,
  });
  console.log(`✓ Assigned new role: ${newUserRole.name}\n`);

  console.log("🎉 User role updated successfully!");
}

fixUserRole()
  .then(() => process.exit(0))
  .catch(e => { 
    console.error("❌ Error:", e); 
    process.exit(1); 
  });
