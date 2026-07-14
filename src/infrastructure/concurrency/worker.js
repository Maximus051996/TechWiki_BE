import { parentPort } from 'node:worker_threads';
import { TASKS } from './tasks.js';

/**
 * Worker-thread entry point. Receives { id, taskName, payload }, executes the
 * matching pure task, and posts back { id, result } or { id, error }.
 */
parentPort.on('message', ({ id, taskName, payload }) => {
    try {
        const task = TASKS[taskName];
        if (!task) throw new Error(`Unknown task: ${taskName}`);
        const result = task(payload);
        parentPort.postMessage({ id, result });
    } catch (err) {
        parentPort.postMessage({ id, error: err.message });
    }
});
