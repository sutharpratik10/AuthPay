/**
 * Policy-Based RBAC Service
 * 
 * This service provides efficient policy-based access control where:
 * - Users can have multiple roles
 * - Roles have multiple permissions (policies)
 * - Admin role has override access to everything
 * - Policies are defined as "resource:action" (e.g., "content:create", "user:manage")
 */

import { db } from "@/server/db";
import { roles, userRoles, rolePermissions, permissions } from "@/server/db/schema";
import { eq, inArray, and } from "drizzle-orm";

// Cache for user permissions to reduce database queries
const permissionCache = new Map<string, { permissions: Set<string>; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class RBACService {
  /**
   * Check if a user has a specific policy
   * @param userId - The user ID
   * @param policy - Policy name (e.g., "content:create", "user:manage")
   * @returns Promise<boolean>
   */
  static async hasPolicy(userId: string, policy: string): Promise<boolean> {
    try {
      console.log(`[RBACService] hasPolicy check for user ${userId}, policy: ${policy}`);
      
      // Check if user is admin first (admins have all access)
      const isAdminUser = await this.isAdmin(userId);
      console.log(`[RBACService] isAdmin check result:`, isAdminUser);
      
      if (isAdminUser) {
        console.log(`[RBACService] User is admin, granting access to ${policy}`);
        return true;
      }

      // Check cache first
      const cached = this.getCachedPermissions(userId);
      if (cached) {
        const hasInCache = cached.has(policy);
        console.log(`[RBACService] Cache hit for user ${userId}, has ${policy}:`, hasInCache);
        return hasInCache;
      }

      // Fetch from database
      console.log(`[RBACService] No cache, fetching policies from database for user ${userId}`);
      const userPermissions = await this.getUserPolicies(userId);
      console.log(`[RBACService] User ${userId} policies:`, userPermissions);
      
      // Cache the result
      this.cachePermissions(userId, userPermissions);
      
      const hasPermission = userPermissions.includes(policy);
      console.log(`[RBACService] User ${userId} has policy ${policy}:`, hasPermission);
      return hasPermission;
    } catch (error) {
      console.error("[RBACService] Error checking policy:", error);
      return false;
    }
  }

  /**
   * Check if a user has any of the specified policies
   * @param userId - The user ID
   * @param policies - Array of policy names
   * @returns Promise<boolean>
   */
  static async hasAnyPolicy(userId: string, policies: string[]): Promise<boolean> {
    try {
      const isAdminUser = await this.isAdmin(userId);
      if (isAdminUser) return true;

      const userPermissions = await this.getUserPolicies(userId);
      return policies.some(policy => userPermissions.includes(policy));
    } catch (error) {
      console.error("Error checking policies:", error);
      return false;
    }
  }

  /**
   * Check if a user has all of the specified policies
   * @param userId - The user ID
   * @param policies - Array of policy names
   * @returns Promise<boolean>
   */
  static async hasAllPolicies(userId: string, policies: string[]): Promise<boolean> {
    try {
      const isAdminUser = await this.isAdmin(userId);
      if (isAdminUser) return true;

      const userPermissions = await this.getUserPolicies(userId);
      return policies.every(policy => userPermissions.includes(policy));
    } catch (error) {
      console.error("Error checking policies:", error);
      return false;
    }
  }

  /**
   * Get all policies for a user (union of all their roles' policies)
   * @param userId - The user ID
   * @returns Promise<string[]>
   */
  static async getUserPolicies(userId: string): Promise<string[]> {
    try {
      // Get user's roles from userRoles table
      const userRolesRecords = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, userId),
        columns: { roleId: true }
      });

      const roleIds = userRolesRecords.map(r => r.roleId);

      if (roleIds.length === 0) return [];

      // Get all permissions for these roles
      const rolePerms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(inArray(rolePermissions.roleId, roleIds));

      // Return unique permissions
      return [...new Set(rolePerms.map((p: any) => p.name))] as string[];
    } catch (error) {
      console.error("Error getting user policies:", error);
      return [];
    }
  }

  /**
   * Check if a user is an admin
   * @param userId - The user ID
   * @returns Promise<boolean>
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const userRoleNames = await this.getUserRoles(userId);
      return userRoleNames.some(role => 
        ["admin", "Admin", "Administrator"].includes(role)
      );
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  /**
   * Get all role names for a user
   * @param userId - The user ID
   * @returns Promise<string[]>
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
   * Assign a role to a user
   * @param adminUserId - The admin user ID performing the action
   * @param targetUserId - The user to assign the role to
   * @param roleId - The role ID to assign
   * @returns Promise<boolean>
   */
  static async assignRole(adminUserId: string, targetUserId: string, roleId: string): Promise<boolean> {
    try {
      // Check if admin
      const isAdminUser = await this.isAdmin(adminUserId);
      if (!isAdminUser) {
        console.error("User is not an admin");
        return false;
      }

      // Check if role exists
      const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId)
      });

      if (!role) {
        console.error("Role not found");
        return false;
      }

      // Check if user-role already exists
      const existing = await db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.userId, targetUserId),
          eq(userRoles.roleId, roleId)
        )
      });

      if (existing) {
        console.log("User already has this role");
        return true; // Not an error, role is already assigned
      }

      // Insert user-role
      await db.insert(userRoles).values({
        userId: targetUserId,
        roleId: roleId,
        assignedBy: adminUserId
      });

      // Clear cache
      this.clearCache(targetUserId);

      return true;
    } catch (error) {
      console.error("Error assigning role:", error);
      return false;
    }
  }

  /**
   * Remove a role from a user
   * @param adminUserId - The admin user ID performing the action
   * @param targetUserId - The user to remove the role from
   * @param roleId - The role ID to remove
   * @returns Promise<boolean>
   */
  static async removeRole(adminUserId: string, targetUserId: string, roleId: string): Promise<boolean> {
    try {
      // Check if admin
      const isAdminUser = await this.isAdmin(adminUserId);
      if (!isAdminUser) {
        console.error("User is not an admin");
        return false;
      }

      // Delete user-role
      await db.delete(userRoles).where(
        and(
          eq(userRoles.userId, targetUserId),
          eq(userRoles.roleId, roleId)
        )
      );

      // Clear cache
      this.clearCache(targetUserId);

      return true;
    } catch (error) {
      console.error("Error removing role:", error);
      return false;
    }
  }

  /**
   * Get cached permissions for a user
   */
  private static getCachedPermissions(userId: string): Set<string> | null {
    const cached = permissionCache.get(userId);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      permissionCache.delete(userId);
      return null;
    }

    return cached.permissions;
  }

  /**
   * Cache permissions for a user
   */
  private static cachePermissions(userId: string, permissions: string[]): void {
    permissionCache.set(userId, {
      permissions: new Set(permissions),
      timestamp: Date.now()
    });
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
