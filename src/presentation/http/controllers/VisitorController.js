import { ok } from '../presenters/respond.js';
import { extractIp } from '../../../application/services/userAgent.js';

/**
 * Visitor controller.
 *  - `track` is a public beacon the customer portal calls with the real page
 *    route it rendered; fire-and-forget, returns 202 immediately.
 *  - `list` / `stats` are admin-only endpoints for reviewing access history.
 */
export class VisitorController {
    constructor({ visitorUseCases }) {
        this.uc = visitorUseCases;
        this.list = this.list.bind(this);
        this.stats = this.stats.bind(this);
        this.track = this.track.bind(this);
    }

    async track(req, res) {
        const payload = {
            ip: extractIp(req),
            userAgent: req.headers['user-agent'] ?? '',
            path: typeof req.body?.path === 'string' ? req.body.path.slice(0, 300) : (req.originalUrl || ''),
            referrer: req.headers['referer'] ?? req.headers['referrer'] ?? '',
        };
        // Detached; never blocks the beacon response.
        this.uc.record(payload).catch(() => { });
        return res.status(202).json({ success: true, data: { accepted: true } });
    }

    async list(req, res) {
        return ok(res, await this.uc.list(req.query));
    }

    async stats(_req, res) {
        return ok(res, await this.uc.stats());
    }
}
