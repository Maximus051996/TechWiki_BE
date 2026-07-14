import { ICacheService } from '../../domain/services/ports.js';

/**
 * Bounded in-process LRU cache with per-entry TTL.
 *
 * Bounding by item count + TTL keeps memory usage predictable (no unbounded
 * growth => no memory leak), while insertion-order eviction via Map gives O(1)
 * LRU behaviour. Serves hot content without hitting MongoDB, which is what lets
 * a single worker comfortably absorb hundreds of concurrent readers.
 */
export class LruCache extends ICacheService {
    constructor({ maxItems = 1000, ttlMs = 60_000 } = {}) {
        super();
        this.maxItems = maxItems;
        this.defaultTtl = ttlMs;
        this.store = new Map(); // key -> { value, expiresAt }
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }
        // Refresh recency: delete + re-insert moves key to the newest position.
        this.store.delete(key);
        this.store.set(key, entry);
        return entry.value;
    }

    set(key, value, ttlMs) {
        if (this.store.has(key)) this.store.delete(key);
        else if (this.store.size >= this.maxItems) {
            // Evict least-recently-used (first inserted key).
            const oldest = this.store.keys().next().value;
            if (oldest !== undefined) this.store.delete(oldest);
        }
        this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtl) });
        return value;
    }

    delete(key) {
        return this.store.delete(key);
    }

    invalidatePrefix(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) this.store.delete(key);
        }
    }

    clear() {
        this.store.clear();
    }

    get size() {
        return this.store.size;
    }
}
