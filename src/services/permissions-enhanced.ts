import { users, roles, rolePermissions, permissions } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Permission service for direct user-role relationship
 * (Refactored: no tenants, no userRoles)
 */
export class PermissionService {
  /**
   * Check if a user has a specific permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { roleId: true, roleID: true }
      });
      const roleId = user?.roleId || user?.roleID;
      if (!roleId) return false;
      const role = await db.query.roles.findFirst({ where: eq(roles.id, roleId) });
      if (!role) return false;
      if (["admin", "Admin", "Administrator"].includes(role.name)) return true;
      const perms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, roleId));
      return perms.some(p => p.name === permission);
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  /**
   * Check if a user is an admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { roleId: true, roleID: true }
      });
      const roleId = user?.roleId || user?.roleID;
      if (!roleId) return false;
      const role = await db.query.roles.findFirst({ where: eq(roles.id, roleId) });
      if (!role) return false;
      return ["admin", "Admin", "Administrator"].includes(role.name);
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  /**
   * Get user role name
   */
  static async getUserRole(userId: string): Promise<string | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { roleId: true, roleID: true }
      });
      const roleId = user?.roleId || user?.roleID;
      if (!roleId) return null;
      const role = await db.query.roles.findFirst({ where: eq(roles.id, roleId) });
      return role?.name || null;
    } catch (error) {
      console.error("Error getting user role:", error);
      return null;
    }
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { roleId: true, roleID: true }
      });
      const roleId = user?.roleId || user?.roleID;
      if (!roleId) return [];
      const perms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, roleId));
      return perms.map(p => p.name);
    } catch (error) {
      console.error("Error getting user permissions:", error);
      return [];
    }
  }

  /**
   * Set user role (admin only)
   */
  static async setUserRole(adminUserId: string, targetUserId: string, roleId: string): Promise<boolean> {
    try {
      const isAdminUser = await this.isAdmin(adminUserId);
      if (!isAdminUser) return false;
      await db.update(users)
        .set({ roleId, updatedAt: new Date().toISOString() })
        .where(eq(users.id, targetUserId));
      return true;
    } catch (error) {
      console.error("Error setting user role:", error);
      return false;
    }
  }
}
