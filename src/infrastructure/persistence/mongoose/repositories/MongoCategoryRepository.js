import { ICategoryRepository } from '../../../../domain/repositories/ICategoryRepository.js';
import { CategoryModel } from '../models.js';
import { toCategory } from '../mappers.js';
import { buildFilter, buildSort, escapeRegExp } from '../queryBuilder.js';
import { Status } from '../../../../domain/value-objects/Status.js';

export class MongoCategoryRepository extends ICategoryRepository {
    async create(category) {
        const doc = await CategoryModel.create({
            moduleId: category.moduleId, name: category.name, slug: category.slug,
            description: category.description, displayOrder: category.displayOrder, status: category.status,
        });
        return toCategory(doc.toObject());
    }

    async update(id, patch) {
        return toCategory(await CategoryModel.findByIdAndUpdate(id, patch, { new: true }).lean());
    }

    async delete(id) {
        await CategoryModel.findByIdAndDelete(id);
    }

    async findById(id) {
        return toCategory(await CategoryModel.findById(id).lean());
    }

    async findBySlug(slug) {
        return toCategory(await CategoryModel.findOne({ slug }).lean());
    }

    async findByModuleAndName(moduleId, name) {
        return toCategory(
            await CategoryModel.findOne({ moduleId, name })
                .collation({ locale: 'en', strength: 2 })
                .lean()
        );
    }

    async list(query = {}) {
        const filter = buildFilter(query);
        const sort = query.sort === 'latest' ? { displayOrder: 1, createdAt: -1 } : buildSort(query.sort);
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(200, Math.max(1, Number(query.limit) || 20));

        const [docs, total] = await Promise.all([
            CategoryModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
            CategoryModel.countDocuments(filter),
        ]);
        return { items: docs.map(toCategory), total };
    }

    async countByModule(moduleId) {
        return CategoryModel.countDocuments({ moduleId });
    }

    async findByModule(moduleId) {
        const docs = await CategoryModel.find({ moduleId }).lean();
        return docs.map(toCategory);
    }

    async deleteByModule(moduleId) {
        const res = await CategoryModel.deleteMany({ moduleId });
        return res.deletedCount ?? 0;
    }

    async search(term, { limit = 10, publishedOnly = false } = {}) {
        const rx = new RegExp(escapeRegExp(term), 'i');
        const filter = { $or: [{ name: rx }, { description: rx }] };
        if (publishedOnly) filter.status = Status.PUBLISHED;
        const docs = await CategoryModel.find(filter).limit(limit).lean();
        return docs.map(toCategory);
    }
}
