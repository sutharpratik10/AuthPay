/**
 * Policy-Based RBAC Service
 * 
 * This service provides efficient policy-based access control where:
 * - Users can have multiple roles
 * - Roles have multiple permissions (policies)
 * - Permissions are stored exclusively in the database (no hardcoded policies)
 * - Admin access is determined by the "admin:access" policy, NOT by role name
 * - Permission inheritance: "resource:manage" implies "resource:view/create/update/delete"
 * - Role priority prevents lower-priority admins from modifying higher-priority ones
 * - Super Admin role is immutable and cannot be modified or deleted
 */

import { db } from "@/server/db";
import { roles, userRoles, rolePermissions, permissions, auditLogs } from "@/server/db/schema";
import { eq, inArray, and, sql, like, or, desc, count } from "drizzle-orm";
import type {
  EffectivePermissions,
  AdminActionResult,
  RoleWithPermissionDetails,
  PermissionDetail,
  PermissionGroup,
} from "./types";

// Cache for user permissions to reduce database queries
const permissionCache = new Map<string, { permissions: Set<string>; roles: string[]; isAdmin: boolean; isSuperAdmin: boolean; highestPriority: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Actions that imply other actions (inheritance)
const ACTION_INHERITANCE: Record<string, string[]> = {
  manage: ["view", "create", "update", "delete"],
};

export class RBACService {

  // ─── Permission Inheritance ──────────────────────────────────────────

  /**
   * Resolve inherited permissions from "resource:manage" → individual CRUD
   * e.g., "content:manage" expands to ["content:view", "content:create", "content:update", "content:delete"]
   */
  static resolveInheritedPermissions(permissionNames: string[]): string[] {
    const expanded = new Set(permissionNames);

    for (const perm of permissionNames) {
      const colonIndex = perm.indexOf(':');
      if (colonIndex === -1) continue;

      const resource = perm.substring(0, colonIndex);
      const action = perm.substring(colonIndex + 1);

      const implied = ACTION_INHERITANCE[action];
      if (implied) {
        for (const impliedAction of implied) {
          expanded.add(`${resource}:${impliedAction}`);
        }
      }
    }

    return [...expanded];
  }

  // ─── Core Permission Checks ──────────────────────────────────────────

  /**
   * Check if a user has a specific policy (with inheritance)
   */
  static async hasPolicy(userId: string, policy: string): Promise<boolean> {
    try {
      // Check cache first
      const cached = this.getCachedData(userId);
      if (cached) {
        // Super Admin has all access
        if (cached.isSuperAdmin) return true;
        return cached.permissions.has(policy);
      }

      // Fetch and cache
      const data = await this.loadAndCacheUserData(userId);
      if (data.isSuperAdmin) return true;
      return data.permissions.has(policy);
    } catch (error) {
      console.error("[RBACService] Error checking policy:", error);
      return false;
    }
  }

  /**
   * Check if a user has any of the specified policies
   */
  static async hasAnyPolicy(userId: string, policies: string[]): Promise<boolean> {
    try {
      const data = await this.getOrLoadCachedData(userId);
      if (data.isSuperAdmin) return true;
      return policies.some(policy => data.permissions.has(policy));
    } catch (error) {
      console.error("Error checking policies:", error);
      return false;
    }
  }

  /**
   * Check if a user has all of the specified policies
   */
  static async hasAllPolicies(userId: string, policies: string[]): Promise<boolean> {
    try {
      const data = await this.getOrLoadCachedData(userId);
      if (data.isSuperAdmin) return true;
      return policies.every(policy => data.permissions.has(policy));
    } catch (error) {
      console.error("Error checking policies:", error);
      return false;
    }
  }

  /**
   * Check if a user is an admin (has "admin:access" policy)
   * Uses policy-based check instead of role name matching
   */
  static async isAdmin(userId: string): Promise<boolean> {
    return this.hasPolicy(userId, "admin:access");
  }

  /**
   * Check if a user is a Super Admin
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const data = await this.getOrLoadCachedData(userId);
      return data.isSuperAdmin;
    } catch (error) {
      console.error("Error checking super admin status:", error);
      return false;
    }
  }

  // ─── User Data Retrieval ─────────────────────────────────────────────

  /**
   * Get all policies for a user (union of all their roles' policies, with inheritance)
   */
  static async getUserPolicies(userId: string): Promise<string[]> {
    try {
      const data = await this.getOrLoadCachedData(userId);
      return [...data.permissions];
    } catch (error) {
      console.error("Error getting user policies:", error);
      return [];
    }
  }

  /**
   * Get all role names for a user
   */
  static async getUserRoles(userId: string): Promise<string[]> {
    try {
      const data = await this.getOrLoadCachedData(userId);
      return data.roles;
    } catch (error) {
      console.error("Error getting user roles:", error);
      return [];
    }
  }

  /**
   * Get effective permissions for a user (detailed breakdown)
   */
  static async getEffectivePermissions(userId: string): Promise<EffectivePermissions> {
    try {
      // Get user's roles from userRoles table
      const userRolesRecords = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, userId),
        columns: { roleId: true }
      });

      const roleIds = userRolesRecords.map(r => r.roleId);
      const roleNames: string[] = [];
      let highestPriority = 0;
      let superAdmin = false;

      if (roleIds.length > 0) {
        const roleRecords = await db.query.roles.findMany({
          where: inArray(roles.id, roleIds),
          columns: { name: true, priority: true, isSuperAdmin: true }
        });

        for (const r of roleRecords) {
          roleNames.push(r.name);
          if ((r.priority ?? 0) > highestPriority) highestPriority = r.priority ?? 0;
          if (r.isSuperAdmin) superAdmin = true;
        }
      }

      // Get explicit permissions
      let explicitPerms: string[] = [];
      if (roleIds.length > 0) {
        const rolePerms = await db
          .select({ name: permissions.name })
          .from(permissions)
          .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
          .where(inArray(rolePermissions.roleId, roleIds));

        explicitPerms = Array.from(new Set<string>(rolePerms.map(p => p.name as string)));
      }

      // Resolve inherited permissions
      const allPerms = this.resolveInheritedPermissions(explicitPerms);
      const inherited = allPerms.filter(p => !explicitPerms.includes(p));

      return {
        userId,
        roles: roleNames,
        explicitPermissions: explicitPerms,
        inheritedPermissions: inherited,
        allPermissions: allPerms,
        isAdmin: allPerms.includes("admin:access"),
        isSuperAdmin: superAdmin,
        highestPriority,
      };
    } catch (error) {
      console.error("Error getting effective permissions:", error);
      return {
        userId,
        roles: [],
        explicitPermissions: [],
        inheritedPermissions: [],
        allPermissions: [],
        isAdmin: false,
        isSuperAdmin: false,
        highestPriority: 0,
      };
    }
  }

  /**
   * Get the highest role priority for a user
   */
  static async getUserHighestPriority(userId: string): Promise<number> {
    try {
      const data = await this.getOrLoadCachedData(userId);
      return data.highestPriority;
    } catch {
      return 0;
    }
  }

  // ─── Role Management (Admin Operations) ──────────────────────────────

  /**
   * Assign a role to a user (with priority enforcement)
   */
  static async assignRole(
    adminUserId: string,
    targetUserId: string,
    roleId: string
  ): Promise<AdminActionResult> {
    try {
      // Check admin permission
      const hasPermission = await this.hasPolicy(adminUserId, "user:manage");
      if (!hasPermission) {
        return { success: false, error: "Insufficient permissions: user:manage required" };
      }

      // Get the role being assigned
      const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId)
      });

      if (!role) {
        return { success: false, error: "Role not found" };
      }

      // Priority enforcement: admin can't assign roles with higher priority than their own
      const adminPriority = await this.getUserHighestPriority(adminUserId);
      const adminIsSuperAdmin = await this.isSuperAdmin(adminUserId);

      if (!adminIsSuperAdmin && (role.priority ?? 0) > adminPriority) {
        return { success: false, error: "Cannot assign a role with higher priority than your own" };
      }

      // Super Admin role can only be assigned by Super Admins
      if (role.isSuperAdmin && !adminIsSuperAdmin) {
        return { success: false, error: "Only Super Admins can assign the Super Admin role" };
      }

      // Check if user-role already exists
      const existing = await db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.userId, targetUserId),
          eq(userRoles.roleId, roleId)
        )
      });

      if (existing) {
        return { success: true, message: "User already has this role" };
      }

      // Insert user-role
      await db.insert(userRoles).values({
        userId: targetUserId,
        roleId: roleId,
        assignedBy: adminUserId
      });

      // Audit log
      const auditId = await this.logAudit(adminUserId, "role_assigned", "user_role", targetUserId, null, {
        roleId,
        roleName: role.name,
        targetUserId,
      });

      // Clear cache
      this.clearCache(targetUserId);

      return { success: true, message: `Role "${role.name}" assigned successfully`, auditId };
    } catch (error) {
      console.error("Error assigning role:", error);
      return { success: false, error: "Failed to assign role" };
    }
  }

  /**
   * Remove a role from a user (with priority enforcement)
   */
  static async removeRole(
    adminUserId: string,
    targetUserId: string,
    roleId: string
  ): Promise<AdminActionResult> {
    try {
      // Check admin permission
      const hasPermission = await this.hasPolicy(adminUserId, "user:manage");
      if (!hasPermission) {
        return { success: false, error: "Insufficient permissions: user:manage required" };
      }

      // Get the role being removed
      const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId)
      });

      if (!role) {
        return { success: false, error: "Role not found" };
      }

      // Priority enforcement
      const adminPriority = await this.getUserHighestPriority(adminUserId);
      const adminIsSuperAdmin = await this.isSuperAdmin(adminUserId);

      if (!adminIsSuperAdmin && (role.priority ?? 0) > adminPriority) {
        return { success: false, error: "Cannot remove a role with higher priority than your own" };
      }

      // Super Admin role can only be removed by Super Admins
      if (role.isSuperAdmin && !adminIsSuperAdmin) {
        return { success: false, error: "Only Super Admins can remove the Super Admin role" };
      }

      // Delete user-role
      await db.delete(userRoles).where(
        and(
          eq(userRoles.userId, targetUserId),
          eq(userRoles.roleId, roleId)
        )
      );

      // Audit log
      const auditId = await this.logAudit(adminUserId, "role_removed", "user_role", targetUserId, {
        roleId,
        roleName: role.name,
        targetUserId,
      }, null);

      // Clear cache
      this.clearCache(targetUserId);

      return { success: true, message: `Role "${role.name}" removed successfully`, auditId };
    } catch (error) {
      console.error("Error removing role:", error);
      return { success: false, error: "Failed to remove role" };
    }
  }

  /**
   * Set all roles for a user (replaces existing roles)
   */
  static async setUserRoles(
    adminUserId: string,
    targetUserId: string,
    roleIds: string[]
  ): Promise<AdminActionResult> {
    try {
      const hasPermission = await this.hasPolicy(adminUserId, "user:manage");
      if (!hasPermission) {
        return { success: false, error: "Insufficient permissions: user:manage required" };
      }

      const adminPriority = await this.getUserHighestPriority(adminUserId);
      const adminIsSuperAdmin = await this.isSuperAdmin(adminUserId);

      // Validate all roles exist and check priority
      const targetRoles = await db.query.roles.findMany({
        where: inArray(roles.id, roleIds),
      });

      if (targetRoles.length !== roleIds.length) {
        return { success: false, error: "One or more roles not found" };
      }

      for (const role of targetRoles) {
        if (!adminIsSuperAdmin && (role.priority ?? 0) > adminPriority) {
          return { success: false, error: `Cannot assign role "${role.name}" — higher priority than your own` };
        }
        if (role.isSuperAdmin && !adminIsSuperAdmin) {
          return { success: false, error: "Only Super Admins can assign the Super Admin role" };
        }
      }

      // Get old roles for audit
      const oldRoles = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, targetUserId),
      });

      // Delete all existing roles for the user
      await db.delete(userRoles).where(eq(userRoles.userId, targetUserId));

      // Insert new roles
      if (roleIds.length > 0) {
        await db.insert(userRoles).values(
          roleIds.map(roleId => ({
            userId: targetUserId,
            roleId,
            assignedBy: adminUserId,
          }))
        );
      }

      // Audit log
      await this.logAudit(adminUserId, "roles_set", "user_role", targetUserId,
        { roleIds: oldRoles.map(r => r.roleId) },
        { roleIds }
      );

      // Clear cache
      this.clearCache(targetUserId);

      return {
        success: true,
        message: `User roles updated. Assigned ${roleIds.length} role(s).`
      };
    } catch (error) {
      console.error("Error setting user roles:", error);
      return { success: false, error: "Failed to set user roles" };
    }
  }

  // ─── Role CRUD ───────────────────────────────────────────────────────

  /**
   * Create a new role
   */
  static async createRole(
    adminUserId: string,
    data: { name: string; description?: string; isDefault?: boolean; priority?: number; permissionIds?: string[] }
  ): Promise<AdminActionResult> {
    try {
      const hasPermission = await this.hasPolicy(adminUserId, "role:create");
      if (!hasPermission) {
        return { success: false, error: "Insufficient permissions: role:create required" };
      }

      // Priority enforcement
      const adminPriority = await this.getUserHighestPriority(adminUserId);
      const adminIsSuperAdmin = await this.isSuperAdmin(adminUserId);
      const newPriority = data.priority ?? 0;

      if (!adminIsSuperAdmin && newPriority >= adminPriority) {
        return { success: false, error: "Cannot create a role with priority equal to or higher than your own" };
      }

      // Check if role name already exists
      const existing = await db.query.roles.findFirst({
        where: eq(roles.name, data.name),
      });

      if (existing) {
        return { success: false, error: `Role "${data.name}" already exists` };
      }

      // Create the role
      const [newRole] = await db.insert(roles).values({
        name: data.name,
        description: data.description || null,
        isDefault: data.isDefault || false,
        isSystemManaged: false,
        isSuperAdmin: false,
        priority: newPriority,
      }).returning();

      // Assign permissions if provided
      if (data.permissionIds && data.permissionIds.length > 0) {
        await db.insert(rolePermissions).values(
          data.permissionIds.map(permId => ({
            roleId: newRole.id,
            permissionId: permId,
          }))
        );
      }

      // Audit log
      await this.logAudit(adminUserId, "role_created", "role", newRole.id, null, {
        name: data.name,
        priority: newPriority,
        permissionCount: data.permissionIds?.length || 0,
      });

      return { success: true, data: newRole, message: `Role "${data.name}" created successfully` };
    } catch (error) {
      console.error("Error creating role:", error);
      return { success: false, error: "Failed to create role" };
    }
  }

  /**
   * Update an existing role
   */
  static async updateRole(
    adminUserId: string,
    roleId: string,
    data: { name?: string; description?: string; isDefault?: boolean; priority?: number }
  ): Promise<AdminActionResult> {
    try {
      const hasPermission = await this.hasPolicy(adminUserId, "role:update");
      if (!hasPermission) {
        return { success: false, error: "Insufficient permissions: role:update required" };
      }

      const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId),
      });

      if (!role) {
        return { success: false, error: "Role not found" };
      }



      // Priority enforcement
      if (data.priority !== undefined) {
        const adminPriority = await this.getUserHighestPriority(adminUserId);
        const adminIsSuperAdmin = await this.isSuperAdmin(adminUserId);

        if (!adminIsSuperAdmin && data.priority >= adminPriority) {
          return { success: false, error: "Cannot set role priority equal to or higher than your own" };
        }
      }

      const oldValues = { name: role.name, description: role.description, isDefault: role.isDefault, priority: role.priority };

      // Update the role
      await db.update(roles).set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.priority !== undefined && { priority: data.priority }),
        updatedAt: new Date(),
      }).where(eq(roles.id, roleId));

      // Audit log
      await this.logAudit(adminUserId, "role_updated", "role", roleId, oldValues, data);

      // Clear all caches (role change affects all users with this role)
      this.clearAllCache();

      return { success: true, message: `Role "${role.name}" updated successfully` };
    } catch (error) {
      console.error("Error updating role:", error);
      return { success: false, error: "Failed to update role" };
    }
  }

  /**
   * Delete a role
   */
  static async deleteRole(
    adminUserId: string,
    roleId: string
  ): Promise<AdminActionResult> {
    try {
      const hasPermission = await this.hasPolicy(adminUserId, "role:delete");
      if (!hasPermission) {
        return { success: false, error: "Insufficient permissions: role:delete required" };
      }

      const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId),
      });

      if (!role) {
        return { success: false, error: "Role not found" };
      }



      // Get affected user count for audit
      const affectedUsers = await db.query.userRoles.findMany({
        where: eq(userRoles.roleId, roleId),
        columns: { userId: true },
      });

      // Delete the role (cascades to role_permissions and user_roles)
      await db.delete(roles).where(eq(roles.id, roleId));

      // Audit log
      await this.logAudit(adminUserId, "role_deleted", "role", roleId, {
        name: role.name,
        priority: role.priority,
        affectedUserCount: affectedUsers.length,
      }, null);

      // Clear caches for affected users
      for (const ur of affectedUsers) {
        this.clearCache(ur.userId);
      }

      return { success: true, message: `Role "${role.name}" deleted. ${affectedUsers.length} user(s) affected.` };
    } catch (error) {
      console.error("Error deleting role:", error);
      return { success: false, error: "Failed to delete role" };
    }
  }

  // ─── Permission Management ───────────────────────────────────────────

  /**
   * Get all permissions grouped by category
   */
  static async getAllPermissions(): Promise<PermissionGroup[]> {
    try {
      const allPerms = await db.query.permissions.findMany({
        orderBy: [permissions.category, permissions.name],
      });

      const groups = new Map<string, PermissionDetail[]>();

      for (const perm of allPerms) {
        const category = perm.category || "Other";
        if (!groups.has(category)) {
          groups.set(category, []);
        }
        groups.get(category)!.push({
          id: perm.id,
          name: perm.name,
          description: perm.description,
          category: perm.category,
          displayName: perm.displayName,
          resource: perm.resource,
          action: perm.action,
          isSystemManaged: perm.isSystemManaged ?? false,
        });
      }

      return Array.from(groups.entries()).map(([category, perms]) => ({
        category,
        permissions: perms,
      }));
    } catch (error) {
      console.error("Error getting all permissions:", error);
      return [];
    }
  }

  /**
   * Get all permissions as a flat list
   */
  static async getAllPermissionsFlat(): Promise<PermissionDetail[]> {
    try {
      const allPerms = await db.query.permissions.findMany({
        orderBy: [permissions.category, permissions.name],
      });

      return allPerms.map(perm => ({
        id: perm.id,
        name: perm.name,
        description: perm.description,
        category: perm.category,
        displayName: perm.displayName,
        resource: perm.resource,
        action: perm.action,
        isSystemManaged: perm.isSystemManaged ?? false,
      }));
    } catch (error) {
      console.error("Error getting all permissions:", error);
      return [];
    }
  }

  /**
   * Create a new permission
   */
  static async createPermission(
    adminUserId: string,
    data: { name: string; description?: string; category?: string; displayName?: string; resource?: string; action?: string }
  ): Promise<AdminActionResult> {
    try {
      const hasPermission = await this.hasPolicy(adminUserId, "policy:create");
      if (!hasPermission) {
        return { success: false, error: "Insufficient permissions: policy:create required" };
      }

      // Check if permission already exists
      const existing = await db.query.permissions.findFirst({
        where: eq(permissions.name, data.name),
      });

      if (existing) {
        return { success: false, error: `Permission "${data.name}" already exists` };
      }

      const [created] = await db.insert(permissions).values({
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        displayName: data.displayName || null,
        resource: data.resource || null,
        action: data.action || null,
        isSystemManaged: false,
      }).returning();

      await this.logAudit(adminUserId, "permission_created", "permission", created.id, null, data);

      return { success: true, data: created, message: `Permission "${data.name}" created successfully` };
    } catch (error) {
      console.error("Error creating permission:", error);
      return { success: false, error: "Failed to create permission" };
    }
  }

  /**
   * Update an existing permission
   */
  static async updatePermission(
    adminUserId: string,
    permissionId: string,
    data: { name?: string; description?: string; category?: string; displayName?: string; resource?: string; action?: string }
  ): Promise<AdminActionResult> {
    try {
      const hasPermission = await this.hasPolicy(adminUserId, "policy:update");
      if (!hasPermission) {
        return { success: false, error: "Insufficient permissions: policy:update required" };
      }

      const existing = await db.query.permissions.findFirst({
        where: eq(permissions.id, permissionId),
      });

      if (!existing) {
        return { success: false, error: "Permission not found" };
      }



      if (data.name && data.name !== existing.name) {
        const nameExists = await db.query.permissions.findFirst({
          where: eq(permissions.name, data.name),
        });
        if (nameExists) {
          return { success: false, error: `Permission "${data.name}" already exists` };
        }
      }

      await db.update(permissions).set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.resource !== undefined && { resource: data.resource }),
        ...(data.action !== undefined && { action: data.action }),
      }).where(eq(permissions.id, permissionId));

      await this.logAudit(adminUserId, "permission_updated", "permission", permissionId, existing, data);
      
      this.clearAllCache();

      return { success: true, message: `Permission updated successfully` };
    } catch (error) {
      console.error("Error updating permission:", error);
      return { success: false, error: "Failed to update permission" };
    }
  }

  /**
   * Delete a permission
   */
  static async deletePermission(
    adminUserId: string,
    permissionId: string
  ): Promise<AdminActionResult> {
    try {
      const hasPermission = await this.hasPolicy(adminUserId, "policy:delete");
      if (!hasPermission) {
        return { success: false, error: "Insufficient permissions: policy:delete required" };
      }

      const existing = await db.query.permissions.findFirst({
        where: eq(permissions.id, permissionId),
      });

      if (!existing) {
        return { success: false, error: "Permission not found" };
      }



      await db.delete(permissions).where(eq(permissions.id, permissionId));
      await this.logAudit(adminUserId, "permission_deleted", "permission", permissionId, existing, null);
      
      this.clearAllCache();

      return { success: true, message: `Permission deleted successfully` };
    } catch (error) {
      console.error("Error deleting permission:", error);
      return { success: false, error: "Failed to delete permission" };
    }
  }

  /**
   * Set permissions for a role (replaces all existing)
   */
  static async setRolePermissions(
    adminUserId: string,
    roleId: string,
    permissionIds: string[]
  ): Promise<AdminActionResult> {
    try {
      const hasPermission = await this.hasPolicy(adminUserId, "role:update");
      if (!hasPermission) {
        return { success: false, error: "Insufficient permissions: role:update required" };
      }

      const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId),
      });

      if (!role) {
        return { success: false, error: "Role not found" };
      }



      // Get old permissions for audit
      const oldPerms = await db.query.rolePermissions.findMany({
        where: eq(rolePermissions.roleId, roleId),
        columns: { permissionId: true },
      });

      // Delete existing role-permission mappings
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      // Insert new mappings
      if (permissionIds.length > 0) {
        await db.insert(rolePermissions).values(
          permissionIds.map(permId => ({
            roleId,
            permissionId: permId,
          }))
        );
      }

      // Audit log
      await this.logAudit(adminUserId, "role_permissions_set", "role", roleId,
        { permissionIds: oldPerms.map(p => p.permissionId) },
        { permissionIds }
      );

      // Clear all caches
      this.clearAllCache();

      return {
        success: true,
        message: `Role "${role.name}" permissions updated. ${permissionIds.length} permission(s) assigned.`
      };
    } catch (error) {
      console.error("Error setting role permissions:", error);
      return { success: false, error: "Failed to set role permissions" };
    }
  }

  /**
   * Get permissions for a specific role
   */
  static async getRolePermissions(roleId: string): Promise<PermissionDetail[]> {
    try {
      const perms = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          category: permissions.category,
          displayName: permissions.displayName,
          resource: permissions.resource,
          action: permissions.action,
          isSystemManaged: permissions.isSystemManaged,
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, roleId));

      return perms.map(p => ({
        ...p,
        isSystemManaged: p.isSystemManaged ?? false,
      }));
    } catch (error) {
      console.error("Error getting role permissions:", error);
      return [];
    }
  }

  // ─── Admin Queries ───────────────────────────────────────────────────

  /**
   * Get all roles with their permissions and user counts (for admin panel)
   */
  static async getAllRolesWithPermissions(
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ): Promise<{ roles: RoleWithPermissionDetails[]; total: number; pages: number }> {
    try {
      // Build where clause
      const whereClause = search
        ? or(
          like(roles.name, `%${search}%`),
          like(roles.description, `%${search}%`)
        )
        : undefined;

      // Count total
      const totalResult = await db
        .select({ count: count() })
        .from(roles)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;

      // Get roles with pagination
      const rolesData = await db.query.roles.findMany({
        where: whereClause,
        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(roles.priority), roles.name],
      });

      // For each role, get permissions and user count
      const result: RoleWithPermissionDetails[] = [];

      for (const role of rolesData) {
        // Get permissions
        const perms = await this.getRolePermissions(role.id);

        // Get user count
        const userCountResult = await db
          .select({ count: count() })
          .from(userRoles)
          .where(eq(userRoles.roleId, role.id));

        result.push({
          id: role.id,
          name: role.name,
          description: role.description,
          isDefault: role.isDefault ?? false,
          isSystemManaged: role.isSystemManaged ?? false,
          isSuperAdmin: role.isSuperAdmin ?? false,
          priority: role.priority ?? 0,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
          userCount: userCountResult[0]?.count ?? 0,
          permissions: perms,
        });
      }

      return {
        roles: result,
        total,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error getting all roles:", error);
      return { roles: [], total: 0, pages: 0 };
    }
  }

  // ─── Audit Logging ───────────────────────────────────────────────────

  /**
   * Log an RBAC action to the audit log
   */
  private static async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null
  ): Promise<string | undefined> {
    try {
      const [entry] = await db.insert(auditLogs).values({
        userId,
        action,
        entityType,
        entityId,
        oldValues: oldValues as unknown as undefined,
        newValues: newValues as unknown as undefined,
        metadata: { source: "rbac_service" },
      }).returning({ id: auditLogs.id });

      return entry?.id;
    } catch (error) {
      console.error("[RBACService] Error logging audit:", error);
      return undefined;
    }
  }

  // ─── Caching ─────────────────────────────────────────────────────────

  /**
   * Get cached data or load and cache
   */
  private static async getOrLoadCachedData(userId: string) {
    const cached = this.getCachedData(userId);
    if (cached) return cached;
    return this.loadAndCacheUserData(userId);
  }

  /**
   * Load user data from DB and cache it
   */
  private static async loadAndCacheUserData(userId: string) {
    // Get user's roles
    const userRolesRecords = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      columns: { roleId: true }
    });

    const roleIds = userRolesRecords.map(r => r.roleId);
    const roleNames: string[] = [];
    let highestPriority = 0;
    let isSuperAdmin = false;

    if (roleIds.length > 0) {
      const roleRecords = await db.query.roles.findMany({
        where: inArray(roles.id, roleIds),
        columns: { name: true, priority: true, isSuperAdmin: true }
      });

      for (const r of roleRecords) {
        roleNames.push(r.name);
        if ((r.priority ?? 0) > highestPriority) highestPriority = r.priority ?? 0;
        if (r.isSuperAdmin) isSuperAdmin = true;
      }
    }

    // Get permissions
    let permissionNames: string[] = [];
    if (roleIds.length > 0) {
      const rolePerms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(inArray(rolePermissions.roleId, roleIds));

      permissionNames = Array.from(new Set<string>(rolePerms.map(p => p.name as string)));
    }

    // Resolve inherited permissions
    const allPerms = this.resolveInheritedPermissions(permissionNames);
    const isAdmin = allPerms.includes("admin:access");

    const data = {
      permissions: new Set(allPerms),
      roles: roleNames,
      isAdmin,
      isSuperAdmin,
      highestPriority,
      timestamp: Date.now(),
    };

    permissionCache.set(userId, data);
    return data;
  }

  /**
   * Get cached data for a user
   */
  private static getCachedData(userId: string) {
    const cached = permissionCache.get(userId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_TTL) {
      permissionCache.delete(userId);
      return null;
    }

    return cached;
  }

  /**
   * Clear cache for a user
   */
  static clearCache(userId: string): void {
    permissionCache.delete(userId);
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    permissionCache.clear();
  }
}
