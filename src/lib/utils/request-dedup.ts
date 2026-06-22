/**
 * Request Deduplication Utility
 * Prevents multiple simultaneous requests to the same endpoint
 * by caching in-flight requests and returning the same Promise
 */

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds

  /**
   * Creates a cache key from URL and options
   */
  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Cleans up expired pending requests
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.CACHE_TTL) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Fetches data with deduplication
   * If a request is already in-flight for the same endpoint, returns the existing Promise
   */
  async fetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    this.cleanup();
    
    const cacheKey = this.getCacheKey(url, options);
    const pending = this.pendingRequests.get(cacheKey);

    // If request is already in-flight, return the existing promise
    if (pending) {
      console.log(`[RequestDedup] Reusing in-flight request for: ${url}`);
      return pending.promise as Promise<T>;
    }

    // Create new request
    const promise = fetch(url, options)
      .then(async (response) => {
        const data = await response.json();
        // Remove from pending requests after completion
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch((error) => {
        // Remove from pending requests on error
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    // Store the pending request
    this.pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Clears all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Clears a specific pending request by URL
   */
  clearUrl(url: string, options?: RequestInit): void {
    const cacheKey = this.getCacheKey(url, options);
    this.pendingRequests.delete(cacheKey);
  }
}

// Export singleton instance
export const requestDedup = new RequestDeduplicator();

// Export wrapped fetch function for convenience
export const dedupFetch = <T = unknown>(url: string, options?: RequestInit): Promise<T> => {
  return requestDedup.fetch<T>(url, options);
};
