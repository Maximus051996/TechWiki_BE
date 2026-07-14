import http from 'node:http';
import { pathToFileURL } from 'node:url';
import env from './config/env.js';
import { logger } from './shared/logger/logger.js';
import { connectDatabase, disconnectDatabase } from './infrastructure/persistence/mongoose/connection.js';
import { createContainer } from './infrastructure/container.js';
import { createApp } from './presentation/http/app.js';

/**
 * Boots a single API instance: DB connection, DI container, HTTP server, and
 * graceful shutdown wiring. Run directly for single-process mode, or spawned by
 * cluster.js for multi-core scaling.
 */
export async function startServer() {
    await connectDatabase();

    const container = createContainer();
    const app = createApp(container);
    const server = http.createServer(app);

    // Keep-alive tuning helps sustain many concurrent reader connections.
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;

    await new Promise((resolve) => server.listen(env.port, resolve));
    logger.info('TechWiki API listening', { port: env.port, env: env.nodeEnv, pid: process.pid });

    let shuttingDown = false;
    const shutdown = async (signal) => {
        if (shuttingDown) return;
        shuttingDown = true;
        logger.info('Shutting down', { signal });

        // Stop accepting new connections, then release resources — no leaks.
        server.close(async () => {
            try {
                await container.dispose();
                await disconnectDatabase();
                logger.info('Shutdown complete');
                process.exit(0);
            } catch (err) {
                logger.error('Error during shutdown', { error: err.message });
                process.exit(1);
            }
        });

        // Force-exit if graceful close stalls.
        setTimeout(() => process.exit(1), 10_000).unref();
    };

    ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
    process.on('unhandledRejection', (reason) =>
        logger.error('Unhandled promise rejection', { reason: String(reason) })
    );

    return { server, container };
}

// Auto-start when executed directly (not when imported by cluster.js as a module).
// pathToFileURL normalises drive letters / slashes so this works on Windows too.
const invokedDirectly =
    process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
    startServer().catch((err) => {
        logger.error('Fatal startup error', { error: err.message, stack: err.stack });
        process.exit(1);
    });
}
