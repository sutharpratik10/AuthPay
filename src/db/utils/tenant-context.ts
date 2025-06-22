import { createDbConnection, getTenantDB } from './connection';
import { eq } from 'drizzle-orm';
import { tenants } from '../schema';
import { cookies } from 'next/headers';

/**
 * Get a tenant by its slug (URL identifier)
 * @param slug The tenant's URL slug
 * @returns The tenant object if found, null otherwise
 */
export async function getTenantBySlug(slug: string) {
  if (typeof window !== 'undefined') {
    return null; // Don't execute in browser
  }

  const db = createDbConnection({ bypassRls: true });
  if (!db) return null;

  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });
    return tenant;
  } catch (error) {
    console.error('Error fetching tenant by slug:', error);
    return null;
  }
}

/**
 * Create a tenant database context from a tenant slug
 * Useful for API routes that need to access tenant-specific data
 * @param slug The tenant slug from the URL
 * @param userId Optional user ID for RLS context
 * @returns A database connection scoped to the tenant
 */
export async function createTenantDbContext(slug: string, userId?: string) {
  if (typeof window !== 'undefined') {
    return null; // Don't execute in browser
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant) return null;
  
  return getTenantDB(tenant.id, userId);
}

/**
 * Extract tenant slug from request headers
 * Used in middleware and API routes
 * @param headers Request headers containing tenant information
 * @returns The tenant slug if found
 */
export function getTenantSlugFromHeaders(headers: Headers) {
  return headers.get('x-tenant-slug') || null;
}

/**
 * Get the current tenant from cookies in server components
 * @returns The current tenant slug from cookies
 */
export async function getCurrentTenantFromCookies() {
  if (typeof window !== 'undefined') {
    console.log('getCurrentTenantFromCookies called in browser');
    return null; // Don't execute in browser
  }

  try {
    const cookieStore = await cookies();
    return cookieStore.get('current-tenant')?.value || null;
  } catch {
    console.error('Error getting current tenant from cookies');
    return null;
  }
}
