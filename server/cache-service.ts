import NodeCache from 'node-cache';

/**
 * Centralized caching service using node-cache for in-memory caching
 * This provides significant performance improvements for frequently accessed data
 */
class CacheService {
    private cache: NodeCache;

    constructor() {
        // Initialize cache with default TTL of 5 minutes (300 seconds)
        this.cache = new NodeCache({
            stdTTL: 300, // Default: 5 minutes
            checkperiod: 60, // Check for expired keys every 60 seconds
            useClones: false, // Don't clone objects for better performance
        });

        // Log cache statistics periodically
        this.cache.on('expired', (key: string) => {
            console.log(`[Cache] Expired: ${key}`);
        });

        console.log('[Cache] Cache service initialized with 5-minute default TTL');
    }

    /**
     * Get value from cache
     * @param key Cache key
     * @returns Cached value or undefined if not found/expired
     */
    get<T>(key: string): T | undefined {
        const value = this.cache.get<T>(key);
        if (value !== undefined) {
            console.log(`[Cache] HIT: ${key}`);
        } else {
            console.log(`[Cache] MISS: ${key}`);
        }
        return value;
    }

    /**
     * Set value in cache
     * @param key Cache key
     * @param value Value to cache
     * @param ttl Time to live in seconds (optional, uses default if not provided)
     */
    set<T>(key: string, value: T, ttl?: number): void {
        const success = this.cache.set(key, value, ttl || 300);
        if (success) {
            console.log(`[Cache] SET: ${key} (TTL: ${ttl || 300}s)`);
        } else {
            console.error(`[Cache] Failed to set: ${key}`);
        }
    }

    /**
     * Delete specific key from cache
     * @param key Cache key to delete
     */
    delete(key: string): void {
        this.cache.del(key);
        console.log(`[Cache] DELETE: ${key}`);
    }

    /**
     * Invalidate cache entries matching a pattern
     * @param pattern Pattern to match (e.g., "dashboard:*", "leads:org:60")
     */
    invalidate(pattern: string): void {
        const keys = this.cache.keys();
        const matchingKeys = keys.filter(key => {
            // Convert pattern to regex (simple wildcard matching)
            const regexPattern = pattern.replace(/\*/g, '.*');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(key);
        });

        if (matchingKeys.length > 0) {
            this.cache.del(matchingKeys);
            console.log(`[Cache] INVALIDATED ${matchingKeys.length} keys matching pattern: ${pattern}`);
        }
    }

    /**
     * Invalidate all cache entries for a specific organization
     * @param orgId Organization ID
     */
    invalidateOrganization(orgId: number): void {
        console.log(`[Cache] Invalidating all cache for organization: ${orgId}`);
        this.invalidate(`*:org:${orgId}*`);
        this.invalidate(`dashboard:analytics:org:${orgId}`);
        this.invalidate(`leads:org:${orgId}`);
        this.invalidate(`fees:org:${orgId}`);
        this.invalidate(`staff:org:${orgId}`);
        this.invalidate(`expenses:org:${orgId}`);
    }

    /**
     * Clear all cache entries
     */
    flush(): void {
        this.cache.flushAll();
        console.log('[Cache] All cache entries cleared');
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            keys: this.cache.keys().length,
            hits: this.cache.getStats().hits,
            misses: this.cache.getStats().misses,
            hitRate: this.cache.getStats().hits / (this.cache.getStats().hits + this.cache.getStats().misses) || 0,
        };
    }

    /**
     * Generate cache key for dashboard analytics
     */
    dashboardKey(orgId?: number): string {
        return orgId ? `dashboard:analytics:org:${orgId}` : 'dashboard:analytics:global';
    }

    /**
     * Generate cache key for leads list
     */
    leadsKey(orgId?: number, status?: string): string {
        const base = orgId ? `leads:org:${orgId}` : 'leads:global';
        return status ? `${base}:status:${status}` : base;
    }

    /**
     * Generate cache key for fee structures
     */
    feeStructuresKey(orgId?: number): string {
        return orgId ? `fees:structures:org:${orgId}` : 'fees:structures:global';
    }

    /**
     * Generate cache key for staff list
     */
    staffKey(orgId?: number): string {
        return orgId ? `staff:org:${orgId}` : 'staff:global';
    }

    /**
     * Generate cache key for expenses
     */
    expensesKey(orgId?: number): string {
        return orgId ? `expenses:org:${orgId}` : 'expenses:global';
    }
}

// Export singleton instance
export const cacheService = new CacheService();
