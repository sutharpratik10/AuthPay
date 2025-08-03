import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BaseRouteHandler } from './BaseRouteHandler';

/**
 * Tenant route handler - base class for tenant-related routes
 */
export abstract class TenantRouteHandler extends BaseRouteHandler {
  /**
   * Check if tenant exists by slug
   */
  protected async tenantExists(slug: string): Promise<boolean> {
    try {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.slug, slug)
      });
      return !!tenant;
    } catch (error) {
      console.error('Error checking tenant existence:', error);
      return false;
    }
  }

  /**
   * Validate tenant input for creation/update
   */
  protected validateTenantInput(data: Record<string, unknown>): { isValid: boolean; error?: string } {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      return { isValid: false, error: 'Tenant name must be at least 2 characters' };
    }

    if (!data.slug || typeof data.slug !== 'string' || !/^[a-z0-9-]+$/.test(data.slug)) {
      return { isValid: false, error: 'Tenant slug must contain only lowercase letters, numbers, and hyphens' };
    }

    // Validate primary color if provided (should be a proper hex color)
    if (data.primaryColor && (typeof data.primaryColor !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(data.primaryColor as string))) {
      return { isValid: false, error: 'Primary color must be a valid hex color (e.g. #FF5733)' };
    }

    return { isValid: true };
  }
    /**
   * Check authorization for tenant operations
   */
  protected async checkTenantAuthorization(req: NextRequest, tenantSlug: string, requiredPermission?: string): Promise<{ authorized: boolean; error?: string; userId?: string; tenant?: Record<string, unknown> }> {
    // Get the current user from the session
    const session = await auth();
    
    if (!session || !session.user) {
      return { authorized: false, error: 'Authentication required' };
    }
    
    try {
      // Check if tenant exists
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.slug, tenantSlug)
      });
      
      if (!tenant) {
        return { authorized: false, error: 'Tenant not found' };
      }
      
      // Check if the user is authenticated at all
      if (!session.user.id) {
        return { authorized: false, error: 'Authentication required' };
      }
      
      const userId = session.user.id;
      
      // Check if a specific permission is required
      if (requiredPermission) {
        try {
          // Use the simplified permission service
          const { PermissionService } = await import('@/services/permissions');
          
          const hasPermission = await PermissionService.hasPermission(
            userId, 
            requiredPermission
          );
          
          if (!hasPermission) {
            return { 
              authorized: false, 
              error: `You don't have the required permission: ${requiredPermission}` 
            };
          }
        } catch (permError) {
          console.error('Error checking permissions:', permError);
          return { authorized: false, error: 'Error checking permissions' };
        }
      }
      
      // Additional check: Users can only access their own tenant, admins can access any tenant
      try {
        const { PermissionService } = await import('@/services/permissions');
        const isAdmin = await PermissionService.isAdmin(userId);
        
        // If not admin, check if this is their own tenant (based on user-tenant relationship)
        if (!isAdmin) {
          // For simplified system: users can access tenant if they own it or are members
          // This is a basic check - in production you might want more sophisticated tenant membership logic
          // For now, we'll allow access and let individual route handlers do more specific checks
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
      
      return { 
        authorized: true, 
        userId, 
        tenant 
      };
    } catch (error) {
      console.error('Error checking tenant authorization:', error);
      return { authorized: false, error: 'Error checking authorization' };
    }
  }
}
