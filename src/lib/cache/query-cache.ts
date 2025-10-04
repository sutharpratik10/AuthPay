/**
 * Database Query Cache
 * 
 * Centralized cache for frequently accessed database lookups
 * that rarely change (like status IDs, role IDs, etc.)
 * 
 * This eliminates repetitive database queries and improves performance
 */

import { db } from '@/server/db';
import { 
  subscriptionStatuses, 
  subscriptionRenewalTypes,
  roles 
} from '@/server/db/schema';
import { eq } from 'drizzle-orm';

// ============================================================================
// CACHE STORAGE
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class QueryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number;

  constructor(ttlMinutes = 30) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Create cache instances (30 minute TTL by default - these rarely change)
const statusCache = new QueryCache<string>(30);
const roleCache = new QueryCache<string>(30);
const renewalTypeCache = new QueryCache<string>(30);

// ============================================================================
// SUBSCRIPTION STATUS LOOKUPS
// ============================================================================

/**
 * Get subscription status ID by name (cached)
 * Common status names: 'active', 'cancelled', 'expired', 'pending'
 */
export async function getStatusId(statusName: string): Promise<string | null> {
  const cacheKey = `status:${statusName}`;
  
  // Check cache first
  const cached = statusCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Query database
  try {
    const status = await db.query.subscriptionStatuses.findFirst({
      where: eq(subscriptionStatuses.name, statusName),
      columns: { id: true }
    });

    if (status?.id) {
      statusCache.set(cacheKey, status.id);
      return status.id;
    }
  } catch (error) {
    console.error(`[Cache] Error fetching status ID for "${statusName}":`, error);
  }

  return null;
}

/**
 * Get subscription status name by ID (cached)
 */
export async function getStatusName(statusId: string): Promise<string | null> {
  const cacheKey = `status:id:${statusId}`;
  
  // Check cache first
  const cached = statusCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Query database
  try {
    const status = await db.query.subscriptionStatuses.findFirst({
      where: eq(subscriptionStatuses.id, statusId),
      columns: { name: true }
    });

    if (status?.name) {
      statusCache.set(cacheKey, status.name);
      return status.name;
    }
  } catch (error) {
    console.error(`[Cache] Error fetching status name for ID "${statusId}":`, error);
  }

  return null;
}

/**
 * Preload all subscription statuses into cache
 * Call this on server startup or periodically
 */
export async function preloadSubscriptionStatuses(): Promise<void> {
  try {
    const statuses = await db.select().from(subscriptionStatuses);
    
    statuses.forEach(status => {
      statusCache.set(`status:${status.name}`, status.id);
      statusCache.set(`status:id:${status.id}`, status.name);
    });

    console.log(`[Cache] Preloaded ${statuses.length} subscription statuses`);
  } catch (error) {
    console.error('[Cache] Error preloading subscription statuses:', error);
  }
}

// ============================================================================
// RENEWAL TYPE LOOKUPS
// ============================================================================

/**
 * Get renewal type ID by name (cached)
 * Common renewal types: 'auto', 'manual'
 */
export async function getRenewalTypeId(typeName: string): Promise<string | null> {
  const cacheKey = `renewal:${typeName}`;
  
  // Check cache first
  const cached = renewalTypeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Query database
  try {
    const renewalType = await db.query.subscriptionRenewalTypes.findFirst({
      where: eq(subscriptionRenewalTypes.name, typeName),
      columns: { id: true }
    });

    if (renewalType?.id) {
      renewalTypeCache.set(cacheKey, renewalType.id);
      return renewalType.id;
    }
  } catch (error) {
    console.error(`[Cache] Error fetching renewal type ID for "${typeName}":`, error);
  }

  return null;
}

/**
 * Preload all renewal types into cache
 */
export async function preloadRenewalTypes(): Promise<void> {
  try {
    const types = await db.select().from(subscriptionRenewalTypes);
    
    types.forEach(type => {
      renewalTypeCache.set(`renewal:${type.name}`, type.id);
    });

    console.log(`[Cache] Preloaded ${types.length} renewal types`);
  } catch (error) {
    console.error('[Cache] Error preloading renewal types:', error);
  }
}

// ============================================================================
// ROLE LOOKUPS
// ============================================================================

/**
 * Get role ID by name (cached)
 * Common roles: 'admin', 'user', 'premium', etc.
 */
export async function getRoleId(roleName: string): Promise<string | null> {
  const cacheKey = `role:${roleName}`;
  
  // Check cache first
  const cached = roleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Query database
  try {
    const role = await db.query.roles.findFirst({
      where: eq(roles.name, roleName),
      columns: { id: true }
    });

    if (role?.id) {
      roleCache.set(cacheKey, role.id);
      return role.id;
    }
  } catch (error) {
    console.error(`[Cache] Error fetching role ID for "${roleName}":`, error);
  }

  return null;
}

/**
 * Get role name by ID (cached)
 */
export async function getRoleName(roleId: string): Promise<string | null> {
  const cacheKey = `role:id:${roleId}`;
  
  // Check cache first
  const cached = roleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Query database
  try {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      columns: { name: true }
    });

    if (role?.name) {
      roleCache.set(cacheKey, role.name);
      return role.name;
    }
  } catch (error) {
    console.error(`[Cache] Error fetching role name for ID "${roleId}":`, error);
  }

  return null;
}

/**
 * Preload all roles into cache
 */
export async function preloadRoles(): Promise<void> {
  try {
    const rolesList = await db.select().from(roles);
    
    rolesList.forEach(role => {
      roleCache.set(`role:${role.name}`, role.id);
      roleCache.set(`role:id:${role.id}`, role.name);
    });

    console.log(`[Cache] Preloaded ${rolesList.length} roles`);
  } catch (error) {
    console.error('[Cache] Error preloading roles:', error);
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Preload all frequently accessed lookups
 * Call this once on server startup
 */
export async function preloadAllCaches(): Promise<void> {
  console.log('[Cache] Starting cache preload...');
  await Promise.all([
    preloadSubscriptionStatuses(),
    preloadRenewalTypes(),
    preloadRoles()
  ]);
  console.log('[Cache] Cache preload complete');
}

/**
 * Clear all caches
 * Call this when data changes (e.g., after creating new status/role)
 */
export function clearAllCaches(): void {
  statusCache.clear();
  roleCache.clear();
  renewalTypeCache.clear();
  console.log('[Cache] All caches cleared');
}

/**
 * Clear specific cache
 */
export function clearCache(type: 'status' | 'role' | 'renewal'): void {
  switch (type) {
    case 'status':
      statusCache.clear();
      break;
    case 'role':
      roleCache.clear();
      break;
    case 'renewal':
      renewalTypeCache.clear();
      break;
  }
  console.log(`[Cache] ${type} cache cleared`);
}

// ============================================================================
// BATCH OPERATIONS (PERFORMANCE OPTIMIZATION)
// ============================================================================

/**
 * Get multiple status IDs at once (batch operation)
 * More efficient than individual lookups
 */
export async function getStatusIds(
  statusNames: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uncachedNames: string[] = [];

  // Check cache for each name
  for (const name of statusNames) {
    const cached = statusCache.get(`status:${name}`);
    if (cached) {
      result.set(name, cached);
    } else {
      uncachedNames.push(name);
    }
  }

  // Batch query for uncached names
  if (uncachedNames.length > 0) {
    try {
      const statuses = await db
        .select()
        .from(subscriptionStatuses);

      statuses.forEach(status => {
        if (uncachedNames.includes(status.name)) {
          result.set(status.name, status.id);
          statusCache.set(`status:${status.name}`, status.id);
        }
      });
    } catch (error) {
      console.error('[Cache] Error in batch status lookup:', error);
    }
  }

  return result;
}

// Export singleton instances for manual cache management if needed
export const cacheInstances = {
  status: statusCache,
  role: roleCache,
  renewalType: renewalTypeCache
};
