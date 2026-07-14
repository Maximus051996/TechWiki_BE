import { IVisitorRepository } from '../../../../domain/repositories/IVisitorRepository.js';
import { VisitorModel } from '../models.js';
import { toVisitor } from '../mappers.js';

/**
 * Mongoose-backed Visitor repository. Writes are fire-and-forget from the
 * request path; reads power the admin visitor log + stats.
 */
export class MongoVisitorRepository extends IVisitorRepository {
    async create(visitor) {
        const { id, createdAt, ...rest } = visitor;
        const doc = await VisitorModel.create(rest);
        return toVisitor(doc.toObject());
    }

    async list(query = {}) {
        const filter = {};
        if (query.country) filter.country = query.country;
        if (query.deviceType) filter.deviceType = query.deviceType;
        if (query.path) filter.path = query.path;

        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));

        const [docs, total] = await Promise.all([
            VisitorModel.find(filter).sort({ visitedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            VisitorModel.countDocuments(filter),
        ]);
        return { items: docs.map(toVisitor), total };
    }

    async stats() {
        const [total, byCountry, byDevice, byBrowser, last24hAgg] = await Promise.all([
            VisitorModel.estimatedDocumentCount(),
            VisitorModel.aggregate([
                { $match: { country: { $ne: '' } } },
                { $group: { _id: '$country', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            VisitorModel.aggregate([
                { $group: { _id: '$deviceType', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            VisitorModel.aggregate([
                { $group: { _id: '$browser', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),
            VisitorModel.countDocuments({ visitedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        ]);

        const shape = (rows) => rows.map((r) => ({ label: r._id || 'Unknown', count: r.count }));
        return {
            total,
            last24h: last24hAgg,
            topCountries: shape(byCountry),
            byDevice: shape(byDevice),
            topBrowsers: shape(byBrowser),
        };
    }
}
