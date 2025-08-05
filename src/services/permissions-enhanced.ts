import { users, roles, userRoles, tenantUsers, rolePermissions, permissions } from "@/db/schema";
import { db } from "@/db";
import { eq, and, or } from "drizzle-orm";

/**
 * Enhanced permission service for role-based access control
 * Supports both simple user.role field and the new roles table system
 */
export class PermissionService {
  /**
   * Check if a user has a specific permission
   * This method checks both the simple role system and the new roles table
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { role: true }
      });
      
      if (!user) {
        return false;
      }
      
      // Admin users (from simple role system) have all permissions
      if (user.role === 'admin') {
        return true;
      }

      // Check permissions from the new roles system
      const hasRolePermission = await this.hasRoleBasedPermission(userId, permission);
      if (hasRolePermission) {
        return true;
      }
      
      // Fallback to simple role permissions for backward compatibility
      if (user.role === 'user') {
        const userPermissions = [
          'subscription.view',
          'subscription.purchase',
          'subscription.cancel',
          'profile.view',
          'profile.edit',
          'tenant.view',
          'tenant.edit', // Users can edit their own tenant
          'content.view',
          'content.create',
          'content.edit',
          'content.delete',
        ];
        
        return userPermissions.includes(permission);
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if a user has a specific permission through the roles table system
   */
  static async hasRoleBasedPermission(userId: string, permission: string): Promise<boolean> {
    try {
      // Get user's permissions through tenantUsers and userRoles
      const userPermissions = await db
        .select({
          permissionName: permissions.name,
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
        .innerJoin(userRoles, eq(roles.id, userRoles.roleId))
        .innerJoin(tenantUsers, eq(userRoles.tenantUserId, tenantUsers.id))
        .where(eq(tenantUsers.userId, userId));

      return userPermissions.some(p => p.permissionName === permission);
    } catch (error) {
      console.error('Error checking role-based permission:', error);
      return false;
    }
  }

  /**
   * Check if a user is an admin (either through simple role or roles table)
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { role: true }
      });
      
      if (!user) {
        return false;
      }

      // Check simple role system first
      if (user.role === 'admin') {
        return true;
      }

      // Check if user has admin role through the roles table
      const adminRoles = await db
        .select({
          roleName: roles.name,
        })
        .from(roles)
        .innerJoin(userRoles, eq(roles.id, userRoles.roleId))
        .innerJoin(tenantUsers, eq(userRoles.tenantUserId, tenantUsers.id))
        .where(and(
          eq(tenantUsers.userId, userId),
          or(
            eq(roles.name, 'Admin'),
            eq(roles.name, 'Administrator'),
            eq(roles.name, 'admin')
          )
        ));

      return adminRoles.length > 0;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get user role from simple role system
   */
  static async getUserRole(userId: string): Promise<'admin' | 'user' | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { role: true }
      });
      
      return user ? (user.role as 'admin' | 'user') : null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * Get all permissions for a user (from both systems)
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { role: true }
      });
      
      if (!user) {
        return [];
      }

      let allPermissions: string[] = [];

      // Get permissions from simple role system
      if (user.role === 'admin') {
        // Admin permissions (comprehensive list)
        allPermissions = [
          // User management
          'user.view', 'user.create', 'user.edit', 'user.delete', 'user.manage',
          
          // Tenant management  
          'tenant.view', 'tenant.create', 'tenant.edit', 'tenant.delete', 'tenant.manage',
          
          // Subscription management
          'subscription.view', 'subscription.create', 'subscription.edit', 
          'subscription.delete', 'subscription.manage', 'subscription.purchase', 'subscription.cancel',
          
          // Content management
          'content.view', 'content.create', 'content.edit', 'content.delete', 'content.manage',
          
          // System management
          'system.manage', 'analytics.view', 'logs.view', 'settings.manage',
          
          // Profile management
          'profile.view', 'profile.edit'
        ];
      } else if (user.role === 'user') {
        // User permissions
        allPermissions = [
          'subscription.view',
          'subscription.purchase', 
          'subscription.cancel',
          'profile.view',
          'profile.edit',
          'tenant.view',
          'tenant.edit',
          'content.view',
          'content.create',
          'content.edit',
          'content.delete',
        ];
      }

      // Get additional permissions from roles table system
      const roleBasedPermissions = await db
        .select({
          permissionName: permissions.name,
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
        .innerJoin(userRoles, eq(roles.id, userRoles.roleId))
        .innerJoin(tenantUsers, eq(userRoles.tenantUserId, tenantUsers.id))
        .where(eq(tenantUsers.userId, userId));

      const rolePermissionNames = roleBasedPermissions.map(p => p.permissionName);
      
      // Combine and deduplicate permissions
      const combinedPermissions = [...new Set([...allPermissions, ...rolePermissionNames])];
      
      return combinedPermissions;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Set user role (admin only operation) - works with simple role system
   */
  static async setUserRole(adminUserId: string, targetUserId: string, role: 'admin' | 'user'): Promise<boolean> {
    try {
      // Check if requesting user is admin
      const isAdminUser = await this.isAdmin(adminUserId);
      if (!isAdminUser) {
        return false;
      }
        await db.update(users)
        .set({ role, updatedAt: new Date().toISOString() })
        .where(eq(users.id, targetUserId));
      
      return true;
    } catch (error) {
      console.error('Error setting user role:', error);
      return false;
    }
  }

  /**
   * Assign a role to a user in the new roles system
   */
  static async assignRole(adminUserId: string, targetUserId: string, roleId: string, tenantId: string): Promise<boolean> {
    try {
      // Check if requesting user is admin
      const isAdminUser = await this.isAdmin(adminUserId);
      if (!isAdminUser) {
        return false;
      }

      // Get the tenant user record
      const tenantUser = await db.query.tenantUsers.findFirst({
        where: and(
          eq(tenantUsers.userId, targetUserId),
          eq(tenantUsers.tenantId, tenantId)
        ),
      });

      if (!tenantUser) {
        return false;
      }

      // Check if role already assigned
      const existingAssignment = await db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.tenantUserId, tenantUser.id),
          eq(userRoles.roleId, roleId)
        ),
      });

      if (existingAssignment) {
        return true; // Already assigned
      }

      // Create the role assignment
      await db.insert(userRoles).values({
        tenantUserId: tenantUser.id,
        roleId: roleId,
      });

      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      return false;
    }
  }

  /**
   * Remove a role from a user in the new roles system
   */
  static async removeRole(adminUserId: string, targetUserId: string, roleId: string, tenantId: string): Promise<boolean> {
    try {
      // Check if requesting user is admin
      const isAdminUser = await this.isAdmin(adminUserId);
      if (!isAdminUser) {
        return false;
      }

      // Get the tenant user record
      const tenantUser = await db.query.tenantUsers.findFirst({
        where: and(
          eq(tenantUsers.userId, targetUserId),
          eq(tenantUsers.tenantId, tenantId)
        ),
      });

      if (!tenantUser) {
        return false;
      }

      // Find and remove the role assignment
      const assignment = await db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.tenantUserId, tenantUser.id),
          eq(userRoles.roleId, roleId)
        ),
      });

      if (assignment) {
        await db.delete(userRoles).where(eq(userRoles.id, assignment.id));
      }

      return true;
    } catch (error) {
      console.error('Error removing role:', error);
      return false;
    }
  }

  /**
   * Get all roles assigned to a user
   */  static async getUserRoles(userId: string, tenantId?: string): Promise<Array<{id: string, name: string, description: string | null}>> {
    try {
      const whereConditions = [eq(tenantUsers.userId, userId)];
      
      if (tenantId) {
        whereConditions.push(eq(tenantUsers.tenantId, tenantId));
      }

      const userRolesList = await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
        })
        .from(roles)
        .innerJoin(userRoles, eq(roles.id, userRoles.roleId))
        .innerJoin(tenantUsers, eq(userRoles.tenantUserId, tenantUsers.id))
        .where(and(...whereConditions));

      return userRolesList;
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }
}
