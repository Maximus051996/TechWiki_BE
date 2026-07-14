import { IGeoLocator } from '../../domain/services/ports.js';
import { logger } from '../../shared/logger/logger.js';

/**
 * Geo locator adapter using a free, keyless IP geolocation HTTP service
 * (ip-api.com by default). Design constraints:
 *
 *  - NEVER throws — always resolves to a (possibly empty) partial object so the
 *    visitor-tracking path can't be broken by a slow/down third party.
 *  - Bounded timeout via AbortController (no hanging sockets / leaks).
 *  - Skips private/loopback IPs (no point looking them up).
 *  - Short in-memory TTL cache keyed by IP to avoid hammering the provider under
 *    concurrent traffic.
 */
export class HttpGeoLocator extends IGeoLocator {
    constructor({ enabled = true, url, timeoutMs = 1500, cache = null } = {}) {
        super();
        this.enabled = enabled;
        this.url = url ?? 'http://ip-api.com/json';
        this.timeoutMs = timeoutMs;
        this.cache = cache; // optional ICacheService
    }

    #isPrivate(ip) {
        return (
            !ip ||
            ip === '127.0.0.1' ||
            ip.startsWith('10.') ||
            ip.startsWith('192.168.') ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
            ip === '::1'
        );
    }

    async locate(ip) {
        if (!this.enabled || this.#isPrivate(ip)) return {};

        const cacheKey = `geo:${ip}`;
        const cached = this.cache?.get(cacheKey);
        if (cached) return cached;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await fetch(`${this.url}/${encodeURIComponent(ip)}`, {
                signal: controller.signal,
            });
            if (!res.ok) return {};
            const data = await res.json();
            // ip-api.com response shape.
            const location = {
                country: data.country ?? '',
                region: data.regionName ?? data.region ?? '',
                city: data.city ?? '',
            };
            this.cache?.set(cacheKey, location, 6 * 60 * 60 * 1000); // 6h
            return location;
        } catch (err) {
            // Timeouts / network errors are expected occasionally — log at debug only.
            logger.debug('Geo lookup failed', { ip, error: err.message });
            return {};
        } finally {
            clearTimeout(timer);
        }
    }
}
