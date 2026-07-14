/**
 * Global search across Modules, Categories, Articles and Videos.
 * Runs the four repository searches concurrently, then offloads relevance
 * ranking to the task runner (worker pool) to keep the event loop free.
 */
export class GlobalSearchUseCase {
    constructor({ moduleRepository, categoryRepository, articleRepository, videoRepository, cache, taskRunner }) {
        this.modules = moduleRepository;
        this.categories = categoryRepository;
        this.articles = articleRepository;
        this.videos = videoRepository;
        this.cache = cache;
        this.taskRunner = taskRunner;
    }

    async execute({ q, limit = 10, publishedOnly = false }) {
        const term = q.trim();
        const cacheKey = `search:${publishedOnly}:${limit}:${term.toLowerCase()}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const opts = { limit, publishedOnly };
        const [modules, categories, articles, videos] = await Promise.all([
            this.modules.search(term, opts),
            this.categories.search(term, opts),
            this.articles.search(term, opts),
            this.videos.search(term, opts),
        ]);

        // Offload ranking (CPU-bound scoring over potentially many rows).
        const ranked = await this.taskRunner.run('rankSearch', { term, modules, categories, articles, videos });

        const result = {
            query: term,
            groups: ranked,
            total:
                ranked.modules.length +
                ranked.categories.length +
                ranked.articles.length +
                ranked.videos.length,
        };
        this.cache.set(cacheKey, result, 30_000);
        return result;
    }
}
