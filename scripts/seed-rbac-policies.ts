/**
 * RBAC Policies Seed Script
 * 
 * This script creates the necessary policies (permissions) and links them to roles.
 * Run this after the main db-seed script to enable the policy-based RBAC system.
 * 
 * Usage: npm run db:seed-rbac
 */

import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

// Load environment variables
const root = path.resolve(__dirname, '../');
const envLocal = path.join(root, '.env.local');
const envDefault = path.join(root, '.env');
const chosenEnv = fs.existsSync(envLocal) ? envLocal : envDefault;
config({ path: chosenEnv, override: true });

import { db } from '../src/server/db/index';
import { roles, permissions, rolePermissions } from '../src/server/db/schema';
import { eq, and } from 'drizzle-orm';

// Define all policies
const defaultPolicies = [
  // Admin policies
  { name: 'admin:access', description: 'Access admin panel', category: 'admin' },
  { name: 'admin:full', description: 'Full admin privileges', category: 'admin' },
  
  // User management policies
  { name: 'user:view', description: 'View users', category: 'user' },
  { name: 'user:manage', description: 'Manage users', category: 'user' },
  { name: 'user:delete', description: 'Delete users', category: 'user' },
  { name: 'user:create', description: 'Create users', category: 'user' },
  
  // Profile policies
  { name: 'profile:view', description: 'View own profile', category: 'profile' },
  { name: 'profile:edit', description: 'Edit own profile', category: 'profile' },
  
  // Account policies
  { name: 'account:manage', description: 'Manage own account', category: 'account' },
  
  // Settings policies
  { name: 'settings:manage', description: 'Manage settings', category: 'settings' },
  
  // Content policies
  { name: 'content:view', description: 'View content', category: 'content' },
  { name: 'content:create', description: 'Create content', category: 'content' },
  { name: 'content:edit', description: 'Edit content', category: 'content' },
  { name: 'content:delete', description: 'Delete content', category: 'content' },
];

// Define policy assignments for each role
const rolePolicyAssignments: Record<string, string[]> = {
  'admin': [
    'admin:access',
    'admin:full',
    'user:view',
    'user:manage',
    'user:delete',
    'user:create',
    'profile:view',
    'profile:edit',
    'account:manage',
    'settings:manage',
    'content:view',
    'content:create',
    'content:edit',
    'content:delete',
  ],
  'user': [
    'profile:view',
    'profile:edit',
    'account:manage',
    'content:view',
  ],
};

async function seedRBACPolicies() {
  try {
    console.log('🔐 Starting RBAC policies seeding...\n');
    
    // ============================================
    // 1. Seed Permissions (Policies)
    // ============================================
    console.log('📜 Creating policies (permissions)...');
    const createdPolicies = new Map<string, string>(); // name -> id
    
    for (const policy of defaultPolicies) {
      const [existingPolicy] = await db
        .insert(permissions)
        .values(policy)
        .onConflictDoNothing()
        .returning();
      
      if (existingPolicy) {
        console.log(`  ✅ Created policy: ${policy.name}`);
        createdPolicies.set(policy.name, existingPolicy.id);
      } else {
        // Policy already exists, fetch its ID
        const existing = await db.query.permissions.findFirst({
          where: eq(permissions.name, policy.name)
        });
        if (existing) {
          console.log(`  ℹ️  Policy already exists: ${policy.name}`);
          createdPolicies.set(policy.name, existing.id);
        }
      }
    }
    console.log(`\n✅ Policies processed: ${createdPolicies.size}\n`);

    // ============================================
    // 2. Assign Policies to Roles
    // ============================================
    console.log('🔗 Assigning policies to roles...\n');
    
    for (const [roleName, policyNames] of Object.entries(rolePolicyAssignments)) {
      // Get role ID
      const role = await db.query.roles.findFirst({
        where: eq(roles.name, roleName)
      });
      
      if (!role) {
        console.log(`  ⚠️  Role not found: ${roleName} (skipping)`);
        continue;
      }
      
      console.log(`  📋 Processing role: ${roleName}`);
      
      let assignedCount = 0;
      let existingCount = 0;
      
      for (const policyName of policyNames) {
        const policyId = createdPolicies.get(policyName);
        
        if (!policyId) {
          console.log(`    ⚠️  Policy not found: ${policyName}`);
          continue;
        }
        
        // Check if assignment already exists
        const existing = await db.query.rolePermissions.findFirst({
          where: and(
            eq(rolePermissions.roleId, role.id),
            eq(rolePermissions.permissionId, policyId)
          )
        });
        
        if (existing) {
          existingCount++;
          continue;
        }
        
        // Create assignment
        await db.insert(rolePermissions).values({
          roleId: role.id,
          permissionId: policyId,
        });
        
        assignedCount++;
      }
      
      console.log(`    ✅ Assigned ${assignedCount} new policies, ${existingCount} already existed\n`);
    }
    
    // ============================================
    // 3. Verification
    // ============================================
    console.log('🔍 Verification...\n');
    
    for (const [roleName, expectedPolicies] of Object.entries(rolePolicyAssignments)) {
      const role = await db.query.roles.findFirst({
        where: eq(roles.name, roleName),
        with: {
          rolePermissions: {
            with: {
              permission: true
            }
          }
        }
      });
      
      if (role) {
        const actualPolicies = role.rolePermissions.map((rp: any) => rp.permission.name);
        console.log(`  📋 Role: ${roleName}`);
        console.log(`    Expected: ${expectedPolicies.length} policies`);
        console.log(`    Actual: ${actualPolicies.length} policies`);
        console.log(`    Policies: ${actualPolicies.join(', ')}\n`);
      }
    }
    
    console.log('✅ RBAC policies seeding completed successfully!\n');
    console.log('🎉 You can now use policy-based RBAC in your application.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding RBAC policies:', error);
    process.exit(1);
  }
}

// Run the seed
seedRBACPolicies();
