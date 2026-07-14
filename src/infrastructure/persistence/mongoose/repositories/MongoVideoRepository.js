import { IVideoRepository } from '../../../../domain/repositories/IVideoRepository.js';
import { VideoModel } from '../models.js';
import { toVideo } from '../mappers.js';
import { buildFilter, buildSort, escapeRegExp } from '../queryBuilder.js';
import { Status } from '../../../../domain/value-objects/Status.js';

export class MongoVideoRepository extends IVideoRepository {
    async create(video) {
        const { id, createdAt, updatedAt, ...rest } = video;
        const doc = await VideoModel.create(rest);
        return toVideo(doc.toObject());
    }

    async update(id, patch) {
        return toVideo(await VideoModel.findByIdAndUpdate(id, patch, { new: true }).lean());
    }

    async delete(id) {
        await VideoModel.findByIdAndDelete(id);
    }

    async findById(id) {
        return toVideo(await VideoModel.findById(id).lean());
    }

    async list(query = {}) {
        const filter = buildFilter(query);
        const sort = buildSort(query.sort);
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(200, Math.max(1, Number(query.limit) || 20));

        const [docs, total] = await Promise.all([
            VideoModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
            VideoModel.countDocuments(filter),
        ]);
        return { items: docs.map(toVideo), total };
    }

    async countByCategory(categoryId) {
        return VideoModel.countDocuments({ categoryId });
    }

    async deleteByCategories(categoryIds) {
        if (!categoryIds || categoryIds.length === 0) return 0;
        const res = await VideoModel.deleteMany({ categoryId: { $in: categoryIds } });
        return res.deletedCount ?? 0;
    }

    async deleteByModule(moduleId) {
        const res = await VideoModel.deleteMany({ moduleId });
        return res.deletedCount ?? 0;
    }

    async incrementViews(id) {
        await VideoModel.updateOne({ _id: id }, { $inc: { views: 1 } });
    }

    async search(term, { limit = 10, publishedOnly = false } = {}) {
        const rx = new RegExp(escapeRegExp(term), 'i');
        const filter = { $or: [{ title: rx }, { description: rx }, { tags: rx }] };
        if (publishedOnly) filter.status = Status.PUBLISHED;
        const docs = await VideoModel.find(filter).limit(limit).lean();
        return docs.map(toVideo);
    }
}
