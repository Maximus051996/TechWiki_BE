import { Video } from '../../../domain/entities/Video.js';
import { Status } from '../../../domain/value-objects/Status.js';
import { paginated } from '../../../shared/utils/Result.js';
import { extractYouTubeId, youtubeThumbnail } from '../../services/youtube.js';
import {
    NotFoundError,
    ConflictError,
    ValidationError,
} from '../../../shared/errors/AppError.js';

const CACHE_PREFIX = 'video:';

/**
 * Video use cases. Enforces the "valid YouTube URL" rule and derives youtubeId /
 * thumbnail from the URL.
 */
export class VideoUseCases {
    constructor({ videoRepository, moduleRepository, categoryRepository, cache }) {
        this.videos = videoRepository;
        this.modules = moduleRepository;
        this.categories = categoryRepository;
        this.cache = cache;
    }

    async #assertParents(moduleId, categoryId) {
        const [module, category] = await Promise.all([
            this.modules.findById(moduleId),
            this.categories.findById(categoryId),
        ]);
        if (!module) throw new NotFoundError('Module');
        if (!category) throw new NotFoundError('Category');
        if (category.moduleId.toString() !== moduleId.toString()) {
            throw new ConflictError('Category does not belong to the specified module');
        }
    }

    #resolveYouTube(url) {
        const youtubeId = extractYouTubeId(url);
        if (!youtubeId) throw new ValidationError('A valid YouTube URL is required');
        return youtubeId;
    }

    async create(input) {
        await this.#assertParents(input.moduleId, input.categoryId);
        const youtubeId = this.#resolveYouTube(input.videoUrl);
        const thumbnail = input.thumbnail || youtubeThumbnail(youtubeId);
        const publishedDate =
            input.status === Status.PUBLISHED ? input.publishedDate ?? new Date() : input.publishedDate ?? null;

        const video = new Video({ ...input, youtubeId, thumbnail, publishedDate });
        const created = await this.videos.create(video);
        this.cache.invalidatePrefix(CACHE_PREFIX);
        return created;
    }

    async update(id, patch) {
        const existing = await this.videos.findById(id);
        if (!existing) throw new NotFoundError('Video');

        if (patch.moduleId || patch.categoryId) {
            await this.#assertParents(patch.moduleId ?? existing.moduleId, patch.categoryId ?? existing.categoryId);
        }
        if (patch.videoUrl) {
            const youtubeId = this.#resolveYouTube(patch.videoUrl);
            patch.youtubeId = youtubeId;
            if (!patch.thumbnail) patch.thumbnail = youtubeThumbnail(youtubeId);
        }
        if (patch.status === Status.PUBLISHED && !existing.publishedDate && !patch.publishedDate) {
            patch.publishedDate = new Date();
        }

        const updated = await this.videos.update(id, patch);
        this.cache.invalidatePrefix(CACHE_PREFIX);
        return updated;
    }

    async delete(id) {
        const existing = await this.videos.findById(id);
        if (!existing) throw new NotFoundError('Video');
        await this.videos.delete(id);
        this.cache.invalidatePrefix(CACHE_PREFIX);
        return { id };
    }

    async getById(id) {
        const video = await this.videos.findById(id);
        if (!video) throw new NotFoundError('Video');
        return video;
    }

    async watchById(id) {
        const video = await this.videos.findById(id);
        if (!video || !video.isPublished()) throw new NotFoundError('Video');
        this.videos.incrementViews(video.id).catch(() => { });
        return video;
    }

    async list(query) {
        const publishedOnly = query.publishedOnly === true;
        const effective = publishedOnly ? { ...query, status: Status.PUBLISHED } : query;
        const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify(effective)}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const { items, total } = await this.videos.list(effective);
        const result = paginated({ items, total, page: query.page, limit: query.limit });
        this.cache.set(cacheKey, result);
        return result;
    }
}
