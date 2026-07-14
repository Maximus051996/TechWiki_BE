import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ITaskRunner } from '../../domain/services/ports.js';
import { TASKS } from './tasks.js';
import { logger } from '../../shared/logger/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, 'worker.js');

/**
 * Fixed-size pool of worker threads implementing the ITaskRunner port.
 *
 * CPU-bound tasks (reading-time computation, search ranking) are dispatched to
 * idle workers, keeping the main event loop free to accept new connections —
 * this is what preserves responsiveness under 300+ concurrent readers.
 *
 * Design:
 *  - Bounded worker count (no thread explosion / memory leak).
 *  - FIFO task queue when all workers are busy.
 *  - Crashed workers are replaced automatically (self-healing).
 *  - Falls back to synchronous execution if the pool is disabled/unavailable.
 */
export class WorkerPool extends ITaskRunner {
    constructor({ size = 4 } = {}) {
        super();
        this.size = Math.max(1, size);
        this.workers = [];
        this.idle = [];
        this.queue = [];
        this.pending = new Map(); // taskId -> { resolve, reject }
        this.seq = 0;
        this.destroyed = false;
        this.#init();
    }

    #init() {
        for (let i = 0; i < this.size; i += 1) this.#spawn();
        logger.info('Worker pool started', { size: this.size });
    }

    #spawn() {
        const worker = new Worker(WORKER_PATH);
        worker.on('message', ({ id, result, error }) => {
            const p = this.pending.get(id);
            if (p) {
                this.pending.delete(id);
                if (error) p.reject(new Error(error));
                else p.resolve(result);
            }
            this.#release(worker);
        });
        worker.on('error', (err) => {
            logger.error('Worker thread error', { error: err.message });
            this.#replace(worker);
        });
        worker.on('exit', (code) => {
            if (!this.destroyed && code !== 0) this.#replace(worker);
        });
        this.workers.push(worker);
        this.idle.push(worker);
        this.#drain();
    }

    #replace(worker) {
        this.workers = this.workers.filter((w) => w !== worker);
        this.idle = this.idle.filter((w) => w !== worker);
        if (!this.destroyed) this.#spawn();
    }

    #release(worker) {
        if (!this.destroyed) {
            this.idle.push(worker);
            this.#drain();
        }
    }

    #drain() {
        while (this.idle.length > 0 && this.queue.length > 0) {
            const worker = this.idle.pop();
            const job = this.queue.shift();
            this.pending.set(job.id, job);
            worker.postMessage({ id: job.id, taskName: job.taskName, payload: job.payload });
        }
    }

    /** @override */
    async run(taskName, payload) {
        if (this.destroyed) {
            // Fallback: run inline so callers still succeed during shutdown.
            return TASKS[taskName]?.(payload);
        }
        return new Promise((resolve, reject) => {
            const id = ++this.seq;
            this.queue.push({ id, taskName, payload, resolve, reject });
            this.#drain();
        });
    }

    async destroy() {
        this.destroyed = true;
        await Promise.all(this.workers.map((w) => w.terminate()));
        this.workers = [];
        this.idle = [];
        this.queue = [];
        this.pending.clear();
    }
}

/**
 * Synchronous fallback runner (implements ITaskRunner) for tests or single-thread
 * mode. Same contract, no threads.
 */
export class InlineTaskRunner extends ITaskRunner {
    async run(taskName, payload) {
        const task = TASKS[taskName];
        if (!task) throw new Error(`Unknown task: ${taskName}`);
        return task(payload);
    }
}
