/**
 * Response Cache Layer
 * 
 * Reduces database/compute load by caching frequently accessed data.
 * Implements multiple caching strategies with automatic invalidation.
 * 
 * Features:
 * - LRU (Least Recently Used) cache eviction
 * - TTL (Time To Live) based expiration
 * - Cache-aside pattern
 * - Stale-while-revalidate support
 * - Tag-based cache invalidation
 */

export interface CacheConfig {
  /** Maximum number of items in cache */
  maxSize: number;
  /** Default TTL in milliseconds */
  defaultTtlMs: number;
  /** Enable stale-while-revalidate */
  staleWhileRevalidate: boolean;
  /** Stale grace period in ms (serve stale content while refreshing) */
  staleGracePeriodMs: number;
}

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  tags: string[];
  hits: number;
  lastAccessedAt: number;
  isStale: boolean;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  staleHits: number;
}

export interface CacheOptions {
  /** TTL for this specific entry */
  ttlMs?: number;
  /** Tags for cache invalidation */
  tags?: string[];
  /** Skip cache for this request */
  skipCache?: boolean;
  /** Force refresh even if cached */
  forceRefresh?: boolean;
}

class ResponseCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private refreshingKeys: Set<string> = new Set();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize ?? 10000,
      defaultTtlMs: config.defaultTtlMs ?? 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidate: config.staleWhileRevalidate ?? true,
      staleGracePeriodMs: config.staleGracePeriodMs ?? 60 * 1000, // 1 minute grace
    };

    this.stats = {
      size: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
      staleHits: 0,
    };

    // Cleanup expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    const isExpired = now > entry.expiresAt;
    const isWithinGracePeriod = now < entry.expiresAt + this.config.staleGracePeriodMs;

    // Completely expired (past grace period)
    if (isExpired && !isWithinGracePeriod) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      this.updateHitRate();
      return null;
    }

    // Update access info
    entry.lastAccessedAt = now;
    entry.hits++;
    
    // Mark as stale if expired but within grace period
    if (isExpired && isWithinGracePeriod) {
      entry.isStale = true;
      this.stats.staleHits++;
    }

    this.stats.hits++;
    this.updateHitRate();

    return entry;
  }

  /**
   * Set a value in cache
   */
  set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    const ttl = options.ttlMs ?? this.config.defaultTtlMs;

    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: now + ttl,
      tags: options.tags ?? [],
      hits: 0,
      lastAccessedAt: now,
      isStale: false,
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  /**
   * Cache-aside pattern: get from cache or compute and store
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    if (options.skipCache) {
      return fetcher();
    }

    const cached = this.get<T>(key);

    // Return fresh cache hit
    if (cached && !cached.isStale && !options.forceRefresh) {
      return cached.value;
    }

    // Stale-while-revalidate: return stale and refresh in background
    if (
      cached?.isStale && 
      this.config.staleWhileRevalidate && 
      !options.forceRefresh
    ) {
      // Trigger background refresh if not already refreshing
      if (!this.refreshingKeys.has(key)) {
        this.refreshInBackground(key, fetcher, options);
      }
      return cached.value;
    }

    // Cache miss or force refresh: fetch and cache
    const value = await fetcher();
    this.set(key, value, options);
    return value;
  }

  /**
   * Refresh cache entry in background
   */
  private async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    this.refreshingKeys.add(key);
    
    try {
      const value = await fetcher();
      this.set(key, value, options);
    } catch (error) {
      console.error(`[Cache] Background refresh failed for key: ${key}`, error);
    } finally {
      this.refreshingKeys.delete(key);
    }
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return deleted;
  }

  /**
   * Invalidate cache entries by tag
   */
  invalidateByTag(tag: string): number {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.stats.size = this.cache.size;
    return count;
  }

  /**
   * Invalidate cache entries by prefix
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.stats.size = this.cache.size;
    return count;
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.stats.size = this.cache.size;
    return count;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt + this.config.staleGracePeriodMs) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestAccess) {
        oldestAccess = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const gracePeriod = this.config.staleGracePeriodMs;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt + gracePeriod) {
        this.cache.delete(key);
      }
    }
    
    this.stats.size = this.cache.size;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Destroy the cache
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

/**
 * Generate cache key from request
 */
export function generateCacheKey(
  path: string,
  params?: Record<string, string | number | boolean>,
  userId?: string
): string {
  const parts = [path];
  
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
    parts.push(sortedParams);
  }
  
  if (userId) {
    parts.push(`user:${userId}`);
  }
  
  return parts.join(':');
}

// Singleton instance
export const responseCache = new ResponseCache({
  maxSize: 10000,
  defaultTtlMs: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true,
  staleGracePeriodMs: 60 * 1000, // 1 minute
});

// Cache TTL presets for different data types
export const CACHE_TTL = {
  /** Static data that rarely changes */
  static: 60 * 60 * 1000, // 1 hour
  
  /** User profile data */
  userProfile: 5 * 60 * 1000, // 5 minutes
  
  /** List/collection data */
  list: 2 * 60 * 1000, // 2 minutes
  
  /** Real-time or frequently changing data */
  realtime: 30 * 1000, // 30 seconds
  
  /** Configuration data */
  config: 15 * 60 * 1000, // 15 minutes
  
  /** API responses */
  api: 60 * 1000, // 1 minute
} as const;

// Configuration presets
export const CACHE_PRESETS = {
  development: {
    maxSize: 1000,
    defaultTtlMs: 60 * 1000, // 1 minute
    staleWhileRevalidate: true,
    staleGracePeriodMs: 30 * 1000,
  },
  production: {
    maxSize: 10000,
    defaultTtlMs: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true,
    staleGracePeriodMs: 60 * 1000,
  },
  highMemory: {
    maxSize: 50000,
    defaultTtlMs: 10 * 60 * 1000, // 10 minutes
    staleWhileRevalidate: true,
    staleGracePeriodMs: 2 * 60 * 1000,
  },
} as const;

export { ResponseCache };
