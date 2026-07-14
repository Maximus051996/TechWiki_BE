import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { querySchemas } from '../../../application/validation/schemas.js';

/**
 * Customer Portal routes — fully public, read-only, published content only.
 */
export function buildPublicRouter({ module, category, article, video, search, visitor }) {
    const r = Router();

    // Visitor tracking beacon — the customer portal reports the page route it
    // rendered. Fire-and-forget on the server; returns 202 immediately.
    r.post('/track', asyncHandler(visitor.track));

    // Modules
    r.get('/modules', validate(querySchemas.list, 'query'), asyncHandler(module.listPublic));
    r.get('/modules/:slug', asyncHandler(module.getBySlugPublic));

    // Categories
    r.get('/categories', validate(querySchemas.list, 'query'), asyncHandler(category.listPublic));
    r.get('/categories/:slug', asyncHandler(category.getBySlugPublic));

    // Articles
    r.get('/articles', validate(querySchemas.list, 'query'), asyncHandler(article.listPublic));
    r.get('/articles/:slug', asyncHandler(article.readBySlug));

    // Videos
    r.get('/videos', validate(querySchemas.list, 'query'), asyncHandler(video.listPublic));
    r.get('/videos/:id', asyncHandler(video.watchById));

    // Global search
    r.get('/search', validate(querySchemas.search, 'query'), asyncHandler(search.publicSearch));

    return r;
}
