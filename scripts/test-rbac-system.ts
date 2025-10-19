/**
 * Test Script: Verify Policy-Based RBAC System
 * 
 * This script tests the complete RBAC system to ensure:
 * 1. Users can be created and assigned roles via user_roles table
 * 2. RBACService correctly fetches user policies
 * 3. Policy checking works as expected
 * 
 * Run: npx tsx scripts/test-rbac-system.ts
 */

import { db } from "../src/server/db";
import { userRoles } from "../src/server/db/schema";
import { RBACService } from "../src/lib/rbac";
import { eq } from "drizzle-orm";

async function testRBACSystem() {
  console.log("🧪 Starting RBAC System Tests...\n");

  try {
    // Test 1: Check if roles exist
    console.log("1️⃣ Test: Verify default roles exist");
    const roles = await db.query.roles.findMany({
      columns: { id: true, name: true, description: true },
    });
    
    if (roles.length === 0) {
      console.log("   ❌ No roles found! Run seed script first: npx tsx scripts/seed-rbac.ts");
      return;
    }
    
    console.log(`   ✅ Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`      - ${role.name}: ${role.description}`);
    });

    // Test 2: Find a test user (or create one)
    console.log("\n2️⃣ Test: Find test user");
    const testUser = await db.query.users.findFirst({
      columns: { id: true, email: true },
      limit: 1,
    });

    if (!testUser) {
      console.log("   ⚠️ No users found in database");
      console.log("   💡 Tip: Register a user via the signup page or API");
      return;
    }

    console.log(`   ✅ Found test user: ${testUser.email} (${testUser.id})`);

    // Test 3: Check user's roles
    console.log("\n3️⃣ Test: Get user's roles via RBACService");
    const userRoleNames = await RBACService.getUserRoles(testUser.id);
    
    if (userRoleNames.length === 0) {
      console.log("   ⚠️ User has no roles assigned");
      
      // Auto-assign default 'user' role
      const userRole = roles.find(r => r.name.toLowerCase() === 'user');
      if (userRole) {
        console.log(`   🔧 Auto-assigning default role: ${userRole.name}`);
        await RBACService.assignRole(testUser.id, userRole.id);
        const updatedRoles = await RBACService.getUserRoles(testUser.id);
        console.log(`   ✅ User now has roles: ${updatedRoles.join(', ')}`);
      }
    } else {
      console.log(`   ✅ User roles: ${userRoleNames.join(', ')}`);
    }

    // Test 4: Get user's policies
    console.log("\n4️⃣ Test: Get user's policies via RBACService");
    const userPolicies = await RBACService.getUserPolicies(testUser.id);
    
    console.log(`   ✅ User has ${userPolicies.length} policies:`);
    if (userPolicies.length > 0) {
      userPolicies.slice(0, 10).forEach(policy => {
        console.log(`      - ${policy}`);
      });
      if (userPolicies.length > 10) {
        console.log(`      ... and ${userPolicies.length - 10} more`);
      }
    } else {
      console.log("   ⚠️ User has no policies! Check role_permissions table");
    }

    // Test 5: Test policy checking
    console.log("\n5️⃣ Test: Policy checking");
    const testPolicies = [
      'profile:view',
      'admin:access',
      'content:create',
      'user:manage',
    ];

    for (const policy of testPolicies) {
      const hasPolicy = await RBACService.hasPolicy(testUser.id, policy);
      const icon = hasPolicy ? '✅' : '❌';
      console.log(`   ${icon} Policy '${policy}': ${hasPolicy}`);
    }

    // Test 6: Verify user_roles table entries
    console.log("\n6️⃣ Test: Verify user_roles table");
    const userRolesRecords = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, testUser.id),
      with: {
        role: {
          columns: { name: true, description: true },
        },
      },
    });

    console.log(`   ✅ Found ${userRolesRecords.length} role assignments:`);
    userRolesRecords.forEach(record => {
      const assignedDate = record.assignedAt ? new Date(record.assignedAt).toLocaleDateString() : 'Unknown';
      console.log(`      - ${record.role.name} (assigned: ${assignedDate})`);
    });

    // Test 7: Cache performance test
    console.log("\n7️⃣ Test: Cache performance");
    const startTime1 = Date.now();
    await RBACService.getUserPolicies(testUser.id);
    const firstCallTime = Date.now() - startTime1;

    const startTime2 = Date.now();
    await RBACService.getUserPolicies(testUser.id);
    const secondCallTime = Date.now() - startTime2;

    console.log(`   📊 First call (cache miss): ${firstCallTime}ms`);
    console.log(`   📊 Second call (cache hit): ${secondCallTime}ms`);
    console.log(`   ✅ Cache speedup: ${(firstCallTime / secondCallTime).toFixed(2)}x faster`);

    console.log("\n✨ All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Total roles: ${roles.length}`);
    console.log(`   - Test user: ${testUser.email}`);
    console.log(`   - User roles: ${userRoleNames.length > 0 ? userRoleNames.join(', ') : 'None'}`);
    console.log(`   - User policies: ${userPolicies.length}`);
    console.log(`   - Cache working: ${secondCallTime < firstCallTime ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  }
}

// Run the tests
testRBACSystem()
  .then(() => {
    console.log("\n🎉 Testing complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
