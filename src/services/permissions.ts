import { roles, permissions, rolePermissions, userRoles } from "@/db/schema";
import { db } from "@/db";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Permission checking service for tenant-specific operations
 */
export class PermissionService {
  /**
   * Check if a user has a specific permission in a tenant
   */
  static async hasPermission(userId: string, tenantId: string, permissionName: string): Promise<boolean> {
    try {
      // Get the tenant-user relationship
      const tenantUser = await db.query.tenantUsers.findFirst({
        where: (tu) => and(
          eq(tu.tenantId, tenantId),
          eq(tu.userId, userId)
        ),
      });
      
      if (!tenantUser) {
        return false;
      }
      
      // Special case: tenant owner has all permissions
      if (tenantUser.isOwner) {
        return true;
      }
      
      // Get user roles for this tenant-user
      const userRoleList = await db.query.userRoles.findMany({
        where: eq(userRoles.tenantUserId, tenantUser.id),
        with: {
          role: true
        }
      });
      
      if (!userRoleList || userRoleList.length === 0) {
        return false;
      }
      
      // Get the permission ID for the permission name
      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.name, permissionName)
      });
      
      if (!permission) {
        return false;
      }
        // Check if any of the user's roles has this permission
      const roleIds = userRoleList.map(ur => ur.role.id);
      
      const rolePermission = await db.query.rolePermissions.findFirst({
        where: (rp) => and(
          inArray(rp.roleId, roleIds),
          eq(rp.permissionId, permission.id)
        )
      });
      
      return !!rolePermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
  
  /**
   * Get all permissions for a user in a tenant
   */
  static async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    try {
      // Get the tenant-user relationship
      const tenantUser = await db.query.tenantUsers.findFirst({
        where: (tu) => and(
          eq(tu.tenantId, tenantId),
          eq(tu.userId, userId)
        ),
      });
      
      if (!tenantUser) {
        return [];
      }
      
      // Special case: tenant owner has all permissions
      if (tenantUser.isOwner) {
        const allPermissions = await db.query.permissions.findMany();
        return allPermissions.map(p => p.name);
      }
      
      // Get user roles for this tenant-user
      const userRoleList = await db.query.userRoles.findMany({
        where: eq(userRoles.tenantUserId, tenantUser.id),
        with: {
          role: true
        }
      });
      
      if (!userRoleList || userRoleList.length === 0) {
        return [];
      }
        // Get all permissions for these roles
      const roleIds = userRoleList.map(ur => ur.role.id);
      
      const rolePerms = await db.query.rolePermissions.findMany({
        where: (rp) => inArray(rp.roleId, roleIds),
        with: {
          permission: true
        }
      });
      
      // Extract unique permission names
      const permissionSet = new Set<string>();
      rolePerms.forEach(rp => {
        permissionSet.add(rp.permission.name);
      });
      
      return Array.from(permissionSet);
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }
  
  /**
   * Create default roles for a new tenant
   */
  static async createDefaultRoles(tenantId: string): Promise<void> {
    try {
      // Create admin role
      const [adminRole] = await db.insert(roles).values({
        tenantId: tenantId,
        name: 'Admin',
        description: 'Full administrative access',
        isDefault: true,
        isSystemManaged: true,
      }).returning();
      
      // Create member role
      const [memberRole] = await db.insert(roles).values({
        tenantId: tenantId,
        name: 'Member',
        description: 'Standard user access',
        isDefault: true,
        isSystemManaged: true,
      }).returning();
      
      // Create guest role
      const [guestRole] = await db.insert(roles).values({
        tenantId: tenantId,
        name: 'Guest',
        description: 'Limited read-only access',
        isDefault: true,
        isSystemManaged: true,
      }).returning();
      
      // Get all available permissions
      const allPermissions = await db.query.permissions.findMany();
      
      // Admin gets all permissions
      const adminPermissions = allPermissions.map(permission => ({
        roleId: adminRole.id,
        permissionId: permission.id
      }));
      
      // Member gets a subset of permissions (example)
      const memberPermissionNames = [
        'tenant.view', 'user.view', 'user.invite',
        'content.create', 'content.edit', 'content.view', 'content.delete',
        'settings.view'
      ];
      
      const memberPermissions = allPermissions
        .filter(p => memberPermissionNames.includes(p.name))
        .map(permission => ({
          roleId: memberRole.id,
          permissionId: permission.id
        }));
      
      // Guest gets minimal permissions
      const guestPermissionNames = ['tenant.view', 'content.view'];
      const guestPermissions = allPermissions
        .filter(p => guestPermissionNames.includes(p.name))
        .map(permission => ({
          roleId: guestRole.id,
          permissionId: permission.id
        }));
      
      // Insert role permissions
      if (adminPermissions.length > 0) {
        await db.insert(rolePermissions).values(adminPermissions);
      }
      
      if (memberPermissions.length > 0) {
        await db.insert(rolePermissions).values(memberPermissions);
      }
      
      if (guestPermissions.length > 0) {
        await db.insert(rolePermissions).values(guestPermissions);
      }
    } catch (error) {
      console.error('Error creating default roles:', error);
      throw error;
    }
  }  /**
   * Get all available permissions 
   */
  static async getAllPermissions() {
    // Using more explicit typing to avoid TypeScript errors
    interface PermissionWithGroups {
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      displayName: string | null;
      isSystemManaged: boolean;
      createdAt: Date;
      updatedAt: Date;
      groupItems: {
        group: {
          id: string;
          name: string;
          description: string | null;
        }
      }[];
    }
    
    return db.query.permissions.findMany({
      with: {
        groupItems: {
          with: {
            group: true
          }
        }
      }
    }) as Promise<PermissionWithGroups[]>;
  }
}
