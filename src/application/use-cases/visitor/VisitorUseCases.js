import { Visitor } from '../../../domain/entities/Visitor.js';
import { parseUserAgent } from '../../services/userAgent.js';
import { paginated } from '../../../shared/utils/Result.js';

/**
 * Visitor tracking use cases.
 *
 * `record` is designed to be called fire-and-forget from the request path: it
 * resolves geo data (best-effort, may be empty) then persists whatever it has.
 * It never throws to the caller, so a tracking failure can't degrade the
 * customer experience.
 */
export class VisitorUseCases {
    constructor({ visitorRepository, geoLocator }) {
        this.visitors = visitorRepository;
        this.geo = geoLocator;
    }

    async record({ ip, userAgent, path, referrer }) {
        const { deviceType, browser, os } = parseUserAgent(userAgent);

        // Geo lookup is best-effort; locate() resolves to {} on any failure.
        let location = {};
        try {
            location = await this.geo.locate(ip);
        } catch {
            location = {};
        }

        const visitor = new Visitor({
            ip,
            country: location.country ?? '',
            region: location.region ?? '',
            city: location.city ?? '',
            deviceType,
            browser,
            os,
            path,
            referrer: referrer ?? '',
            userAgent: userAgent ?? '',
            visitedAt: new Date(),
        });

        try {
            return await this.visitors.create(visitor);
        } catch {
            // Swallow persistence errors — tracking must never break a page view.
            return null;
        }
    }

    async list(query) {
        const { items, total } = await this.visitors.list(query);
        return paginated({ items, total, page: query.page ?? 1, limit: query.limit ?? 50 });
    }

    async stats() {
        return this.visitors.stats();
    }
}
