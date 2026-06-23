import { roles, rolePermissions, permissions, userRoles } from "@/server/db/schema";
import { db } from "@/server/db";
import { eq, inArray } from "drizzle-orm";

/**
 * @deprecated Use RBACService from @/lib/rbac instead
 * 
 * This service is kept for backward compatibility.
 * It now delegates to the new RBAC system that supports multiple roles per user.
 */
export class PermissionService {
  /**
   * @deprecated Use RBACService.hasPolicy() instead
   * Check if a user has a specific permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      // Check if user is admin first
      const isAdminUser = await this.isAdmin(userId);
      if (isAdminUser) return true;

      // Get role IDs from userRoles table
      const userRolesRecords = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, userId),
        columns: { roleId: true }
      });

      const roleIds = userRolesRecords.map(r => r.roleId);

      if (roleIds.length === 0) return false;

      // Get permissions for all roles
      const perms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(inArray(rolePermissions.roleId, roleIds));

      return perms.some(p => p.name === permission);
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  /**
   * @deprecated Use RBACService.isAdmin() instead
   * Check if a user is an admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const roleNames = await this.getUserRoles(userId);
      return roleNames.some(role => 
        ["admin", "Admin", "Administrator"].includes(role)
      );
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  /**
   * @deprecated Use RBACService.getUserRoles() instead
   * Get user role names (returns array now to support multiple roles)
   */
  static async getUserRoles(userId: string): Promise<string[]> {
    try {
      // Get role IDs from userRoles table
      const userRolesRecords = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, userId),
        columns: { roleId: true }
      });

      const roleIds = userRolesRecords.map(r => r.roleId);

      if (roleIds.length === 0) return [];

      // Get role names
      const roleRecords = await db.query.roles.findMany({
        where: inArray(roles.id, roleIds),
        columns: { name: true }
      });

      return roleRecords.map(r => r.name);
    } catch (error) {
      console.error("Error getting user roles:", error);
      return [];
    }
  }

  /**
   * @deprecated Use RBACService.getUserRoles() instead
   * Get user role name (returns first role for backward compatibility)
   */
  static async getUserRole(userId: string): Promise<string | null> {
    try {
      const roleNames = await this.getUserRoles(userId);
      return roleNames.length > 0 ? roleNames[0] : null;
    } catch (error) {
      console.error("Error getting user role:", error);
      return null;
    }
  }

  /**
   * @deprecated Use RBACService.getUserPolicies() instead
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Get role IDs from userRoles table
      const userRolesRecords = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, userId),
        columns: { roleId: true }
      });

      const roleIds = userRolesRecords.map(r => r.roleId);

      if (roleIds.length === 0) return [];

      // Get all permissions for these roles
      const perms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(inArray(rolePermissions.roleId, roleIds));

      // Return unique permissions
      return [...new Set(perms.map((p: any) => p.name))] as string[];
    } catch (error) {
      console.error("Error getting user permissions:", error);
      return [];
    }
  }

  /**
   * @deprecated Use RBACService.assignRole() instead
   * Assign role to user using user_roles table
   */
  static async setUserRole(adminUserId: string, targetUserId: string, roleId: string): Promise<boolean> {
    try {
      const isAdminUser = await this.isAdmin(adminUserId);
      if (!isAdminUser) return false;
      
      // Use the new RBACService to assign role
      const { RBACService } = await import("@/lib/rbac");
      const result = await RBACService.assignRole(adminUserId, targetUserId, roleId);
      return result.success;
    } catch (error) {
      console.error("Error setting user role:", error);
      return false;
    }
  }
}
