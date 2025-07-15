/**
 * Caching service for performance optimization
 */
interface CacheOptions {
    ttl: number; // Time to live in seconds
    maxSize: number; // Maximum cache size
    cleanupInterval: number; // Cleanup interval in seconds
}

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
    accessCount: number;
    lastAccessed: number;
}

class CacheManager<T> {
    private cache: Map<string, CacheEntry<T>> = new Map();
    private options: CacheOptions;
    private cleanupTimer?: NodeJS.Timeout;

    constructor(options: Partial<CacheOptions> = {}) {
        this.options = {
            ttl: 3600, // 1 hour default
            maxSize: 1000,
            cleanupInterval: 300, // 5 minutes
            ...options
        };

        this.startCleanupTimer();
    }

    /**
     * Sets cache entry
     */
    set(key: string, value: T, ttl?: number): void {
        const expiresAt = Date.now() + (ttl || this.options.ttl) * 1000;
        
        this.cache.set(key, {
            value,
            expiresAt,
            accessCount: 0,
            lastAccessed: Date.now()
        });

        this.enforceSizeLimit();
    }

    /**
     * Gets cache entry
     */
    get(key: string): T | undefined {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return undefined;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return undefined;
        }

        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.cache.set(key, entry);

        return entry.value;
    }

    /**
     * Checks if cache entry exists
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return false;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Deletes cache entry
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clears all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Gets cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        totalAccesses: number;
        expiredEntries: number;
    } {
        let totalAccesses = 0;
        let expiredEntries = 0;

        for (const entry of this.cache.values()) {
            totalAccesses += entry.accessCount;
            if (this.isExpired(entry)) {
                expiredEntries++;
            }
        }

        const hitRate = totalAccesses > 0 ? (this.cache.size / totalAccesses) * 100 : 0;

        return {
            size: this.cache.size,
            maxSize: this.options.maxSize,
            hitRate,
            totalAccesses,
            expiredEntries
        };
    }

    /**
     * Gets or sets cache entry with factory function
     */
    async getOrSet(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
        const cached = this.get(key);
        
        if (cached !== undefined) {
            return cached;
        }

        const value = await factory();
        this.set(key, value, ttl);
        return value;
    }

    /**
     * Handles cache warming
     */
    async warmCache(keys: string[], factory: (key: string) => Promise<T>): Promise<void> {
        const promises = keys.map(async (key) => {
            if (!this.has(key)) {
                try {
                    const value = await factory(key);
                    this.set(key, value);
                } catch (error) {
                    console.error(`Failed to warm cache for key ${key}:`, error);
                }
            }
        });

        await Promise.all(promises);
    }

    /**
     * Invalidates cache entries by pattern
     */
    invalidateByPattern(pattern: string): number {
        const regex = new RegExp(pattern);
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
        return keysToDelete.length;
    }

    /**
     * Validates cache integrity
     */
    validateCache(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        let valid = true;

        if (this.cache.size > this.options.maxSize) {
            errors.push(`Cache size (${this.cache.size}) exceeds maximum (${this.options.maxSize})`);
            valid = false;
        }

        let expiredCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                expiredCount++;
            }
        }

        if (expiredCount > 0) {
            errors.push(`Found ${expiredCount} expired entries`);
        }

        return { valid, errors };
    }

    /**
     * Checks if cache entry is expired
     */
    private isExpired(entry: CacheEntry<T>): boolean {
        return Date.now() > entry.expiresAt;
    }

    /**
     * Enforces cache size limit
     */
    private enforceSizeLimit(): void {
        if (this.cache.size <= this.options.maxSize) {
            return;
        }

        const entries = Array.from(this.cache.entries());
        
        // Sort by access count (ascending) and last accessed (ascending)
        entries.sort((a, b) => {
            if (a[1].accessCount !== b[1].accessCount) {
                return a[1].accessCount - b[1].accessCount;
            }
            return a[1].lastAccessed - b[1].lastAccessed;
        });

        // Remove least recently used entries
        const toRemove = this.cache.size - this.options.maxSize;
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
        }
    }

    /**
     * Starts cleanup timer
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.options.cleanupInterval * 1000);
    }

    /**
     * Cleans up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.cache.delete(key));
        
        if (expiredKeys.length > 0) {
            console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
        }
    }

    /**
     * Destroys cache manager
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.cache.clear();
    }
}