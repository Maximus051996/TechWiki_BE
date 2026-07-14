import { Article } from '../../../domain/entities/Article.js';
import { Status } from '../../../domain/value-objects/Status.js';
import { slugify } from '../../../shared/utils/slugify.js';
import { paginated } from '../../../shared/utils/Result.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/AppError.js';

const CACHE_PREFIX = 'article:';

/**
 * Article use cases. Reading time is computed via the injected task runner so the
 * CPU-bound word count can be offloaded to a worker thread under load.
 */
export class ArticleUseCases {
    constructor({ articleRepository, moduleRepository, categoryRepository, cache, taskRunner }) {
        this.articles = articleRepository;
        this.modules = moduleRepository;
        this.categories = categoryRepository;
        this.cache = cache;
        this.taskRunner = taskRunner;
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

    async create(input) {
        await this.#assertParents(input.moduleId, input.categoryId);
        const slug = input.slug ? slugify(input.slug) : slugify(input.title);

        if (await this.articles.findBySlug(slug)) {
            throw new ConflictError('An article with this slug already exists');
        }

        const readingTime = await this.taskRunner.run('readingTime', { content: input.content });
        const publishedDate =
            input.status === Status.PUBLISHED ? input.publishedDate ?? new Date() : input.publishedDate ?? null;

        const article = new Article({ ...input, slug, readingTime, publishedDate });
        const created = await this.articles.create(article);
        this.cache.invalidatePrefix(CACHE_PREFIX);
        return created;
    }

    async update(id, patch) {
        const existing = await this.articles.findById(id);
        if (!existing) throw new NotFoundError('Article');

        const moduleId = patch.moduleId ?? existing.moduleId;
        const categoryId = patch.categoryId ?? existing.categoryId;
        if (patch.moduleId || patch.categoryId) {
            await this.#assertParents(moduleId, categoryId);
        }

        if (patch.slug) {
            patch.slug = slugify(patch.slug);
            const clash = await this.articles.findBySlug(patch.slug);
            if (clash && clash.id !== id) {
                throw new ConflictError('An article with this slug already exists');
            }
        }

        if (patch.content) {
            patch.readingTime = await this.taskRunner.run('readingTime', { content: patch.content });
        }
        if (patch.status === Status.PUBLISHED && !existing.publishedDate && !patch.publishedDate) {
            patch.publishedDate = new Date();
        }

        const updated = await this.articles.update(id, patch);
        this.cache.invalidatePrefix(CACHE_PREFIX);
        return updated;
    }

    async delete(id) {
        const existing = await this.articles.findById(id);
        if (!existing) throw new NotFoundError('Article');
        await this.articles.delete(id);
        this.cache.invalidatePrefix(CACHE_PREFIX);
        return { id };
    }

    async getById(id) {
        const article = await this.articles.findById(id);
        if (!article) throw new NotFoundError('Article');
        return article;
    }

    /** Customer-facing read: only published, and increments view count. */
    async readBySlug(slug) {
        const article = await this.articles.findBySlug(slug);
        if (!article || !article.isPublished()) throw new NotFoundError('Article');
        // Fire-and-forget view increment; never blocks the read path.
        this.articles.incrementViews(article.id).catch(() => { });
        return article;
    }

    async list(query) {
        const publishedOnly = query.publishedOnly === true;
        const effective = publishedOnly ? { ...query, status: Status.PUBLISHED } : query;
        const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify(effective)}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const { items, total } = await this.articles.list(effective);
        const result = paginated({ items, total, page: query.page, limit: query.limit });
        this.cache.set(cacheKey, result);
        return result;
    }
}
