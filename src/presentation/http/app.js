import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import env from '../../config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import { AuthController } from './controllers/AuthController.js';
import { ModuleController } from './controllers/ModuleController.js';
import { CategoryController } from './controllers/CategoryController.js';
import { ArticleController } from './controllers/ArticleController.js';
import { VideoController } from './controllers/VideoController.js';
import { SearchController } from './controllers/SearchController.js';
import { DashboardController } from './controllers/DashboardController.js';
import { VisitorController } from './controllers/VisitorController.js';

import { buildPublicRouter } from './routes/publicRoutes.js';
import { buildAdminRouter } from './routes/adminRoutes.js';

/**
 * Builds the Express application from a DI container. Pure function of the
 * container => trivially testable and free of module-level singletons.
 */
export function createApp(container) {
    const { useCases, services } = container;
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    // --- Security & performance middleware ---
    app.use(helmet());
    app.use(cors({ origin: env.corsOrigins, credentials: true }));
    app.use(compression()); // gzip responses -> less bandwidth, faster reads
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
    if (!env.isProduction) app.use(morgan('dev'));

    // Global rate limit protects against abusive clients / accidental floods.
    app.use(
        rateLimit({
            windowMs: 60_000,
            max: 600, // generous for ~300 concurrent readers, still bounds abuse
            standardHeaders: true,
            legacyHeaders: false,
        })
    );

    // --- Controllers ---
    const controllers = {
        auth: new AuthController({
            loginUseCase: useCases.login,
            refreshTokenUseCase: useCases.refreshToken,
        }),
        module: new ModuleController({ moduleUseCases: useCases.module }),
        category: new CategoryController({ categoryUseCases: useCases.category }),
        article: new ArticleController({ articleUseCases: useCases.article }),
        video: new VideoController({ videoUseCases: useCases.video }),
        search: new SearchController({ globalSearchUseCase: useCases.search }),
        dashboard: new DashboardController({ dashboardUseCase: useCases.dashboard }),
        visitor: new VisitorController({ visitorUseCases: useCases.visitor }),
    };

    // --- Health check ---
    app.get('/health', (_req, res) =>
        res.json({ success: true, data: { status: 'ok', pid: process.pid, cache: services.cache.size } })
    );

    // --- Routers (distinct base paths for the two portals) ---
    app.use('/api/public', buildPublicRouter(controllers));
    app.use('/api/admin', buildAdminRouter({ controllers, tokenService: services.tokenService }));

    // --- Fallbacks ---
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
