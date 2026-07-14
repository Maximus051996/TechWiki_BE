import cluster from 'node:cluster';
import os from 'node:os';
import env from './config/env.js';
import { logger } from './shared/logger/logger.js';

/**
 * Cluster entry point for production. The primary process forks one worker per
 * CPU core; each worker runs an independent HTTP server + worker-thread pool.
 * The OS load-balances incoming connections across workers, letting the box
 * absorb far more than 300 concurrent readers while isolating failures — a
 * crashed worker is replaced without dropping the rest.
 */
const workerCount = Math.max(1, env.isProduction ? os.cpus().length : Math.min(2, os.cpus().length));

if (cluster.isPrimary) {
    logger.info('Primary starting cluster', { pid: process.pid, workers: workerCount });

    for (let i = 0; i < workerCount; i += 1) cluster.fork();

    cluster.on('exit', (worker, code, signal) => {
        logger.warn('Worker died — respawning', { pid: worker.process.pid, code, signal });
        if (code !== 0 && !worker.exitedAfterDisconnect) cluster.fork();
    });
} else {
    const { startServer } = await import('./server.js');
    startServer().catch((err) => {
        logger.error('Worker failed to start', { error: err.message });
        process.exit(1);
    });
}
