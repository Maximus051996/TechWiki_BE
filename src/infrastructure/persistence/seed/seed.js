import env from '../../../config/env.js';
import { logger } from '../../../shared/logger/logger.js';
import { connectDatabase, disconnectDatabase } from '../mongoose/connection.js';
import { UserModel, ModuleModel, CategoryModel, ArticleModel, VideoModel } from '../mongoose/models.js';
import { BcryptPasswordHasher } from '../../security/BcryptPasswordHasher.js';
import { Status } from '../../../domain/value-objects/Status.js';
import { slugify } from '../../../shared/utils/slugify.js';
import { extractYouTubeId, youtubeThumbnail } from '../../../application/services/youtube.js';

/**
 * Idempotent seed: creates the bootstrap admin and a small published dataset so
 * the customer portal has content on first run. Safe to re-run.
 */
async function seed() {
    await connectDatabase();
    const hasher = new BcryptPasswordHasher(10);

    // --- Admin ---
    const email = env.bootstrapAdmin.email.toLowerCase();
    let admin = await UserModel.findOne({ email });
    if (!admin) {
        admin = await UserModel.create({
            name: env.bootstrapAdmin.name,
            email,
            passwordHash: await hasher.hash(env.bootstrapAdmin.password),
            role: 'admin',
        });
        logger.info('Seeded admin user', { email });
    } else {
        logger.info('Admin already exists', { email });
    }

    // --- Module ---
    const moduleName = 'Web Development';
    let mod = await ModuleModel.findOne({ slug: slugify(moduleName) });
    if (!mod) {
        mod = await ModuleModel.create({
            name: moduleName,
            slug: slugify(moduleName),
            description: 'Everything about building for the web.',
            icon: 'globe',
            displayOrder: 1,
            status: Status.PUBLISHED,
        });
    }

    // --- Category ---
    const catName = 'JavaScript';
    let cat = await CategoryModel.findOne({ slug: slugify(catName) });
    if (!cat) {
        cat = await CategoryModel.create({
            moduleId: mod._id,
            name: catName,
            slug: slugify(catName),
            description: 'The language of the web.',
            displayOrder: 1,
            status: Status.PUBLISHED,
        });
    }

    // --- Article ---
    const articleSlug = 'understanding-the-event-loop';
    if (!(await ArticleModel.findOne({ slug: articleSlug }))) {
        await ArticleModel.create({
            title: 'Understanding the Event Loop',
            slug: articleSlug,
            moduleId: mod._id,
            categoryId: cat._id,
            shortDescription: 'How Node.js handles concurrency on a single thread.',
            content:
                '<h2>The Event Loop</h2><p>Node.js uses a single-threaded event loop with ' +
                'non-blocking I/O to handle many concurrent connections efficiently. CPU-bound ' +
                'work should be offloaded to worker threads to keep it responsive.</p>',
            tags: ['nodejs', 'javascript', 'concurrency'],
            status: Status.PUBLISHED,
            featured: true,
            readingTime: 3,
            publishedDate: new Date(),
        });
    }

    // --- Video ---
    const videoUrl = 'https://www.youtube.com/watch?v=8aGhZQkoFbQ';
    if (!(await VideoModel.findOne({ videoUrl }))) {
        const yt = extractYouTubeId(videoUrl);
        await VideoModel.create({
            title: 'What the heck is the event loop anyway?',
            moduleId: mod._id,
            categoryId: cat._id,
            videoUrl,
            youtubeId: yt,
            thumbnail: youtubeThumbnail(yt),
            description: 'A classic deep dive into the JavaScript event loop.',
            duration: '26:52',
            tags: ['javascript', 'event-loop'],
            status: Status.PUBLISHED,
            featured: true,
            publishedDate: new Date(),
        });
    }

    logger.info('Seed complete');
    await disconnectDatabase();
}

seed().catch(async (err) => {
    logger.error('Seed failed', { error: err.message, stack: err.stack });
    await disconnectDatabase();
    process.exit(1);
});
