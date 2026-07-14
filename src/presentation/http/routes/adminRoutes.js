import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import env from '../../../config/env.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { makeAuthenticate, requireAdmin } from '../middleware/authenticate.js';
import {
    authSchemas,
    moduleSchemas,
    categorySchemas,
    articleSchemas,
    videoSchemas,
    querySchemas,
} from '../../../application/validation/schemas.js';

/**
 * Admin Portal routes — authenticated, full CRUD.
 * Mounted under a distinct base path (/api/admin) so the Admin Portal has a
 * different URL from the Customer Portal (business requirement).
 */
export function buildAdminRouter({ controllers, tokenService }) {
    const { auth, module, category, article, video, search, dashboard, visitor } = controllers;
    const authenticate = makeAuthenticate(tokenService);
    const r = Router();

    // Throttle login attempts to blunt brute-force attacks. Disabled on
    // serverless (rate limiter reads req.ip which has no socket there, and
    // per-instance counters are meaningless across serverless invocations).
    const loginGuards = env.serverless
        ? []
        : [rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })];

    // --- Auth (public within admin namespace) ---
    r.post('/auth/login', ...loginGuards, validate(authSchemas.login), asyncHandler(auth.login));
    r.post('/auth/refresh', asyncHandler(auth.refresh));

    // Everything below requires a valid admin token.
    r.use(authenticate, requireAdmin);

    r.get('/auth/me', asyncHandler(auth.me));
    r.get('/dashboard', asyncHandler(dashboard.summary));
    r.get('/search', validate(querySchemas.search, 'query'), asyncHandler(search.adminSearch));

    // --- Visitor log (customer access history) ---
    r.get('/visitors', validate(querySchemas.visitors, 'query'), asyncHandler(visitor.list));
    r.get('/visitors/stats', asyncHandler(visitor.stats));

    // --- Modules ---
    r.get('/modules', validate(querySchemas.list, 'query'), asyncHandler(module.list));
    r.post('/modules', validate(moduleSchemas.create), asyncHandler(module.create));
    r.get('/modules/:id', asyncHandler(module.getById));
    r.put('/modules/:id', validate(moduleSchemas.update), asyncHandler(module.update));
    r.delete('/modules/:id', asyncHandler(module.remove));

    // --- Categories ---
    r.get('/categories', validate(querySchemas.list, 'query'), asyncHandler(category.list));
    r.post('/categories', validate(categorySchemas.create), asyncHandler(category.create));
    r.get('/categories/:id', asyncHandler(category.getById));
    r.put('/categories/:id', validate(categorySchemas.update), asyncHandler(category.update));
    r.delete('/categories/:id', asyncHandler(category.remove));

    // --- Articles ---
    r.get('/articles', validate(querySchemas.list, 'query'), asyncHandler(article.list));
    r.post('/articles', validate(articleSchemas.create), asyncHandler(article.create));
    r.get('/articles/:id', asyncHandler(article.getById));
    r.put('/articles/:id', validate(articleSchemas.update), asyncHandler(article.update));
    r.delete('/articles/:id', asyncHandler(article.remove));

    // --- Videos ---
    r.get('/videos', validate(querySchemas.list, 'query'), asyncHandler(video.list));
    r.post('/videos', validate(videoSchemas.create), asyncHandler(video.create));
    r.get('/videos/:id', asyncHandler(video.getById));
    r.put('/videos/:id', validate(videoSchemas.update), asyncHandler(video.update));
    r.delete('/videos/:id', asyncHandler(video.remove));

    return r;
}
