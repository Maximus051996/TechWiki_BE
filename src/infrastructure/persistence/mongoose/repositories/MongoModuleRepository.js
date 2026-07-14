import { IModuleRepository } from '../../../../domain/repositories/IModuleRepository.js';
import { ModuleModel } from '../models.js';
import { toModule } from '../mappers.js';
import { buildFilter, buildSort, escapeRegExp } from '../queryBuilder.js';
import { Status } from '../../../../domain/value-objects/Status.js';

/**
 * Mongoose-backed Module repository. All read queries use `.lean()` to skip
 * hydration overhead — critical for serving many concurrent readers cheaply.
 */
export class MongoModuleRepository extends IModuleRepository {
    async create(module) {
        const doc = await ModuleModel.create({
            name: module.name, slug: module.slug, description: module.description,
            icon: module.icon, displayOrder: module.displayOrder, status: module.status,
        });
        return toModule(doc.toObject());
    }

    async update(id, patch) {
        const doc = await ModuleModel.findByIdAndUpdate(id, patch, { new: true }).lean();
        return toModule(doc);
    }

    async delete(id) {
        await ModuleModel.findByIdAndDelete(id);
    }

    async findById(id) {
        return toModule(await ModuleModel.findById(id).lean());
    }

    async findBySlug(slug) {
        return toModule(await ModuleModel.findOne({ slug }).lean());
    }

    async findByName(name) {
        return toModule(
            await ModuleModel.findOne({ name }).collation({ locale: 'en', strength: 2 }).lean()
        );
    }

    async list(query = {}) {
        const filter = buildFilter(query);
        const sort = query.sort === 'latest' ? { displayOrder: 1, createdAt: -1 } : buildSort(query.sort);
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(200, Math.max(1, Number(query.limit) || 20));

        const [docs, total] = await Promise.all([
            ModuleModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
            ModuleModel.countDocuments(filter),
        ]);
        return { items: docs.map(toModule), total };
    }

    async search(term, { limit = 10, publishedOnly = false } = {}) {
        const rx = new RegExp(escapeRegExp(term), 'i');
        const filter = { $or: [{ name: rx }, { description: rx }] };
        if (publishedOnly) filter.status = Status.PUBLISHED;
        const docs = await ModuleModel.find(filter).limit(limit).lean();
        return docs.map(toModule);
    }
}
