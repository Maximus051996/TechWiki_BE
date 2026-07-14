import { Module } from '../../../domain/entities/Module.js';
import { Status } from '../../../domain/value-objects/Status.js';
import { slugify } from '../../../shared/utils/slugify.js';
import { paginated } from '../../../shared/utils/Result.js';
import {
    ConflictError,
    NotFoundError,
} from '../../../shared/errors/AppError.js';

const CACHE_PREFIX = 'module:';
// Cache prefixes of dependent resources that must be invalidated on cascade.
const DEPENDENT_PREFIXES = ['category:', 'article:', 'video:'];

/**
 * Encapsulates all Module business operations. Each public method is a discrete
 * use case (SRP at the method level) sharing injected dependencies (DIP).
 */
export class ModuleUseCases {
    constructor({ moduleRepository, categoryRepository, articleRepository, videoRepository, cache }) {
        this.modules = moduleRepository;
        this.categories = categoryRepository;
        this.articles = articleRepository;
        this.videos = videoRepository;
        this.cache = cache;
    }

    async create(input) {
        const slug = slugify(input.name);
        if (await this.modules.findByName(input.name)) {
            throw new ConflictError('A module with this name already exists');
        }
        const module = new Module({ ...input, slug });
        const created = await this.modules.create(module);
        this.cache.invalidatePrefix(CACHE_PREFIX);
        return created;
    }

    async update(id, patch) {
        const existing = await this.modules.findById(id);
        if (!existing) throw new NotFoundError('Module');

        if (patch.name && patch.name !== existing.name) {
            const clash = await this.modules.findByName(patch.name);
            if (clash && clash.id !== id) {
                throw new ConflictError('A module with this name already exists');
            }
            patch.slug = slugify(patch.name);
        }
        const updated = await this.modules.update(id, patch);
        this.cache.invalidatePrefix(CACHE_PREFIX);
        return updated;
    }

    /**
     * Deletes a module and CASCADES to all dependent data: every article and
     * video under the module, then its categories, then the module itself.
     * Returns a summary of how many records were removed.
     */
    async delete(id) {
        const existing = await this.modules.findById(id);
        if (!existing) throw new NotFoundError('Module');

        // Remove children first so no orphaned articles/videos/categories remain.
        const [deletedArticles, deletedVideos] = await Promise.all([
            this.articles.deleteByModule(id),
            this.videos.deleteByModule(id),
        ]);
        const deletedCategories = await this.categories.deleteByModule(id);
        await this.modules.delete(id);

        // Invalidate module + all dependent caches.
        this.cache.invalidatePrefix(CACHE_PREFIX);
        DEPENDENT_PREFIXES.forEach((p) => this.cache.invalidatePrefix(p));

        return {
            id,
            deleted: {
                categories: deletedCategories,
                articles: deletedArticles,
                videos: deletedVideos,
            },
        };
    }

    async getById(id) {
        const module = await this.modules.findById(id);
        if (!module) throw new NotFoundError('Module');
        return module;
    }

    async getBySlug(slug, { publishedOnly = false } = {}) {
        const cacheKey = `${CACHE_PREFIX}slug:${slug}:${publishedOnly}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const module = await this.modules.findBySlug(slug);
        if (!module || (publishedOnly && !module.isPublished())) {
            throw new NotFoundError('Module');
        }
        this.cache.set(cacheKey, module);
        return module;
    }

    async list(query) {
        const publishedOnly = query.publishedOnly === true;
        const effective = publishedOnly ? { ...query, status: Status.PUBLISHED } : query;
        const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify(effective)}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const { items, total } = await this.modules.list(effective);
        const result = paginated({ items, total, page: query.page, limit: query.limit });
        this.cache.set(cacheKey, result);
        return result;
    }
}
