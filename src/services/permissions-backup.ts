import { users } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Simplified permission service for user role-based access control
 * Since tenants are individual users, we only need Admin and User roles
 */
export class PermissionService {
  /**
   * Check if a user has a specific permission based on their role
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
      
      // Admin has all permissions
      if (user.role === 'admin') {
        return true;
      }
      
      // Define user permissions
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
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
  
  /**
   * Get user role
   */  static async getUserRole(userId: string): Promise<'admin' | 'user' | null> {
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
   * Check if user is admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    return role === 'admin';
  }
  
  /**
   * Get all permissions for a user based on their role
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const role = await this.getUserRole(userId);
      
      if (!role) {
        return [];
      }
      
      if (role === 'admin') {
        // Admin gets all permissions
        return [
          // User management
          'user.view',
          'user.create',
          'user.edit',
          'user.delete',
          'user.manage',
          
          // Tenant management
          'tenant.view',
          'tenant.create',
          'tenant.edit',
          'tenant.delete',
          'tenant.manage',
          
          // Subscription management
          'subscription.view',
          'subscription.create',
          'subscription.edit',
          'subscription.delete',
          'subscription.manage',
          'subscription.purchase',
          'subscription.cancel',
          
          // Content management
          'content.view',
          'content.create',
          'content.edit',
          'content.delete',
          'content.manage',
          
          // System management
          'system.manage',
          'analytics.view',
          'logs.view',
          'settings.manage',
          
          // Profile management
          'profile.view',
          'profile.edit',
        ];
      }
      
      // Regular user permissions
      return [
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
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }
  
  /**
   * Set user role (admin only operation)
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
}
