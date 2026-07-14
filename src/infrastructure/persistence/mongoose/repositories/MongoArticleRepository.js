import { IArticleRepository } from '../../../../domain/repositories/IArticleRepository.js';
import { ArticleModel } from '../models.js';
import { toArticle } from '../mappers.js';
import { buildFilter, buildSort, escapeRegExp } from '../queryBuilder.js';
import { Status } from '../../../../domain/value-objects/Status.js';

export class MongoArticleRepository extends IArticleRepository {
    async create(article) {
        const doc = await ArticleModel.create({ ...stripId(article) });
        return toArticle(doc.toObject());
    }

    async update(id, patch) {
        return toArticle(await ArticleModel.findByIdAndUpdate(id, patch, { new: true }).lean());
    }

    async delete(id) {
        await ArticleModel.findByIdAndDelete(id);
    }

    async findById(id) {
        return toArticle(await ArticleModel.findById(id).lean());
    }

    async findBySlug(slug) {
        return toArticle(await ArticleModel.findOne({ slug }).lean());
    }

    async list(query = {}) {
        const filter = buildFilter(query);
        const sort = buildSort(query.sort);
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(200, Math.max(1, Number(query.limit) || 20));

        // List views never need the full content payload — project it out.
        const projection = query.withContent ? {} : { content: 0 };
        const [docs, total] = await Promise.all([
            ArticleModel.find(filter, projection).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
            ArticleModel.countDocuments(filter),
        ]);
        return { items: docs.map(toArticle), total };
    }

    async countByCategory(categoryId) {
        return ArticleModel.countDocuments({ categoryId });
    }

    async deleteByCategories(categoryIds) {
        if (!categoryIds || categoryIds.length === 0) return 0;
        const res = await ArticleModel.deleteMany({ categoryId: { $in: categoryIds } });
        return res.deletedCount ?? 0;
    }

    async deleteByModule(moduleId) {
        const res = await ArticleModel.deleteMany({ moduleId });
        return res.deletedCount ?? 0;
    }

    async incrementViews(id) {
        await ArticleModel.updateOne({ _id: id }, { $inc: { views: 1 } });
    }

    async search(term, { limit = 10, publishedOnly = false } = {}) {
        const rx = new RegExp(escapeRegExp(term), 'i');
        const filter = { $or: [{ title: rx }, { shortDescription: rx }, { tags: rx }] };
        if (publishedOnly) filter.status = Status.PUBLISHED;
        const docs = await ArticleModel.find(filter, { content: 0 }).limit(limit).lean();
        return docs.map(toArticle);
    }
}

function stripId(entity) {
    const { id, createdAt, updatedAt, ...rest } = entity;
    return rest;
}
