import { Category } from '../../../domain/entities/Category.js';
import { Status } from '../../../domain/value-objects/Status.js';
import { slugify } from '../../../shared/utils/slugify.js';
import { paginated } from '../../../shared/utils/Result.js';
import {
    ConflictError,
    NotFoundError,
} from '../../../shared/errors/AppError.js';

const CACHE_PREFIX = 'category:';
const DEPENDENT_PREFIXES = ['article:', 'video:'];

/**
 * Category use cases. Enforces: category belongs to one module and a unique name
 * within a module. Deletion CASCADES to the category's articles and videos.
 */
export class CategoryUseCases {
    constructor({ categoryRepository, moduleRepository, articleRepository, videoRepository, cache }) {
        this.categories = categoryRepository;
        this.modules = moduleRepository;
        this.articles = articleRepository;
        this.videos = videoRepository;
        this.cache = cache;
    }

    async #assertModuleExists(moduleId) {
        const module = await this.modules.findById(moduleId);
        if (!module) throw new NotFoundError('Module');
        return module;
    }

    async create(input) {
        await this.#assertModuleExists(input.moduleId);
        if (await this.categories.findByModuleAndName(input.moduleId, input.name)) {
            throw new ConflictError('A category with this name already exists in this module');
        }
        const category = new Category({ ...input, slug: slugify(input.name) });
        const created = await this.categories.create(category);
        this.cache.invalidatePrefix(CACHE_PREFIX);
        return created;
    }

    async update(id, patch) {
        const existing = await this.categories.findById(id);
        if (!existing) throw new NotFoundError('Category');

        const targetModule = patch.moduleId ?? existing.moduleId;
        if (patch.moduleId) await this.#assertModuleExists(patch.moduleId);

        const targetName = patch.name ?? existing.name;
        if (patch.name || patch.moduleId) {
            const clash = await this.categories.findByModuleAndName(targetModule, targetName);
            if (clash && clash.id !== id) {
                throw new ConflictError('A category with this name already exists in this module');
            }
        }
        if (patch.name) patch.slug = slugify(patch.name);

        const updated = await this.categories.update(id, patch);
        this.cache.invalidatePrefix(CACHE_PREFIX);
        return updated;
    }

    /**
     * Deletes a category and CASCADES to its articles and videos.
     */
    async delete(id) {
        const existing = await this.categories.findById(id);
        if (!existing) throw new NotFoundError('Category');

        const [deletedArticles, deletedVideos] = await Promise.all([
            this.articles.deleteByCategories([id]),
            this.videos.deleteByCategories([id]),
        ]);
        await this.categories.delete(id);

        this.cache.invalidatePrefix(CACHE_PREFIX);
        DEPENDENT_PREFIXES.forEach((p) => this.cache.invalidatePrefix(p));

        return { id, deleted: { articles: deletedArticles, videos: deletedVideos } };
    }

    async getById(id) {
        const category = await this.categories.findById(id);
        if (!category) throw new NotFoundError('Category');
        return category;
    }

    async getBySlug(slug, { publishedOnly = false } = {}) {
        const category = await this.categories.findBySlug(slug);
        if (!category || (publishedOnly && !category.isPublished())) {
            throw new NotFoundError('Category');
        }
        return category;
    }

    async list(query) {
        const publishedOnly = query.publishedOnly === true;
        const effective = publishedOnly ? { ...query, status: Status.PUBLISHED } : query;
        const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify(effective)}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const { items, total } = await this.categories.list(effective);
        const result = paginated({ items, total, page: query.page, limit: query.limit });
        this.cache.set(cacheKey, result);
        return result;
    }
}
