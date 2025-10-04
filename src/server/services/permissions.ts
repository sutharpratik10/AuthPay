import { users, roles, rolePermissions, permissions } from "@/server/db/schema";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";

/**
 * Permission service for direct user-role relationship
 */
export class PermissionService {
  /**
   * Check if a user has a specific permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { roleId: true }
      });
      if (!user || !user.roleId) return false;
      // Get role
      const role = await db.query.roles.findFirst({ where: eq(roles.id, user.roleId) });
      if (!role) return false;
      // Admins have all permissions
      if (["admin", "Admin", "Administrator"].includes(role.name)) return true;
      // Get permissions for role
      const perms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, user.roleId));
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
        columns: { roleId: true }
      });
      if (!user || !user.roleId) return false;
      const role = await db.query.roles.findFirst({ where: eq(roles.id, user.roleId) });
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
        columns: { roleId: true }
      });
      if (!user || !user.roleId) return null;
      const role = await db.query.roles.findFirst({ where: eq(roles.id, user.roleId) });
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
        columns: { roleId: true }
      });
      if (!user || !user.roleId) return [];
      const perms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, user.roleId));
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
