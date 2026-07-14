import { Status } from '../../../domain/value-objects/Status.js';

/**
 * Aggregates admin dashboard data: counts + latest content.
 * All independent queries run concurrently.
 */
export class DashboardUseCase {
    constructor({ moduleRepository, categoryRepository, articleRepository, videoRepository }) {
        this.modules = moduleRepository;
        this.categories = categoryRepository;
        this.articles = articleRepository;
        this.videos = videoRepository;
    }

    async getSummary() {
        const latestQuery = { page: 1, limit: 5, sort: 'latest' };
        const [modules, categories, articles, videos, latestArticles, latestVideos] =
            await Promise.all([
                this.modules.list({ page: 1, limit: 1 }),
                this.categories.list({ page: 1, limit: 1 }),
                this.articles.list({ page: 1, limit: 1 }),
                this.videos.list({ page: 1, limit: 1 }),
                this.articles.list(latestQuery),
                this.videos.list(latestQuery),
            ]);

        return {
            totals: {
                modules: modules.total,
                categories: categories.total,
                articles: articles.total,
                videos: videos.total,
            },
            latestArticles: latestArticles.items,
            latestVideos: latestVideos.items,
        };
    }
}
