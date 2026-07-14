import env from '../config/env.js';

// Repositories
import { MongoUserRepository } from './persistence/mongoose/repositories/MongoUserRepository.js';
import { MongoModuleRepository } from './persistence/mongoose/repositories/MongoModuleRepository.js';
import { MongoCategoryRepository } from './persistence/mongoose/repositories/MongoCategoryRepository.js';
import { MongoArticleRepository } from './persistence/mongoose/repositories/MongoArticleRepository.js';
import { MongoVideoRepository } from './persistence/mongoose/repositories/MongoVideoRepository.js';
import { MongoVisitorRepository } from './persistence/mongoose/repositories/MongoVisitorRepository.js';

// Services
import { BcryptPasswordHasher } from './security/BcryptPasswordHasher.js';
import { JwtTokenService } from './security/JwtTokenService.js';
import { LruCache } from './cache/LruCache.js';
import { WorkerPool, InlineTaskRunner } from './concurrency/WorkerPool.js';
import { HttpGeoLocator } from './geo/HttpGeoLocator.js';

// Use cases
import { LoginUseCase } from '../application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '../application/use-cases/auth/RefreshTokenUseCase.js';
import { ModuleUseCases } from '../application/use-cases/module/ModuleUseCases.js';
import { CategoryUseCases } from '../application/use-cases/category/CategoryUseCases.js';
import { ArticleUseCases } from '../application/use-cases/article/ArticleUseCases.js';
import { VideoUseCases } from '../application/use-cases/video/VideoUseCases.js';
import { GlobalSearchUseCase } from '../application/use-cases/search/GlobalSearchUseCase.js';
import { DashboardUseCase } from '../application/use-cases/dashboard/DashboardUseCase.js';
import { VisitorUseCases } from '../application/use-cases/visitor/VisitorUseCases.js';

/**
 * Composition root. Constructs all singletons and wires dependencies by
 * abstraction. This is the ONLY place that knows concrete implementations —
 * every other layer depends on interfaces (Dependency Inversion).
 */
export function createContainer() {
    // --- Infrastructure services ---
    const cache = new LruCache(env.cache);
    // Serverless platforms (Vercel/Lambda) don't reliably support worker threads
    // and reset between invocations, so fall back to the inline task runner.
    const taskRunner = env.serverless
        ? new InlineTaskRunner()
        : new WorkerPool({ size: env.workerPoolSize });
    const passwordHasher = new BcryptPasswordHasher(10);
    const tokenService = new JwtTokenService(env.jwt);
    const geoLocator = new HttpGeoLocator({ ...env.geo, cache });

    // --- Repositories ---
    const userRepository = new MongoUserRepository();
    const moduleRepository = new MongoModuleRepository();
    const categoryRepository = new MongoCategoryRepository();
    const articleRepository = new MongoArticleRepository();
    const videoRepository = new MongoVideoRepository();
    const visitorRepository = new MongoVisitorRepository();

    // --- Use cases ---
    const useCases = {
        login: new LoginUseCase({ userRepository, passwordHasher, tokenService }),
        refreshToken: new RefreshTokenUseCase({ userRepository, tokenService }),
        module: new ModuleUseCases({ moduleRepository, categoryRepository, articleRepository, videoRepository, cache }),
        category: new CategoryUseCases({
            categoryRepository, moduleRepository, articleRepository, videoRepository, cache,
        }),
        article: new ArticleUseCases({
            articleRepository, moduleRepository, categoryRepository, cache, taskRunner,
        }),
        video: new VideoUseCases({ videoRepository, moduleRepository, categoryRepository, cache }),
        search: new GlobalSearchUseCase({
            moduleRepository, categoryRepository, articleRepository, videoRepository, cache, taskRunner,
        }),
        dashboard: new DashboardUseCase({
            moduleRepository, categoryRepository, articleRepository, videoRepository,
        }),
        visitor: new VisitorUseCases({ visitorRepository, geoLocator }),
    };

    return {
        services: { cache, taskRunner, passwordHasher, tokenService, geoLocator },
        repositories: {
            userRepository, moduleRepository, categoryRepository, articleRepository, videoRepository, visitorRepository,
        },
        useCases,
        async dispose() {
            if (typeof taskRunner.destroy === 'function') await taskRunner.destroy();
            cache.clear();
        },
    };
}
