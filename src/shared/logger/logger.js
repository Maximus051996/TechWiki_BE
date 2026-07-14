/**
 * Minimal structured logger. Kept dependency-free so it works identically in the
 * primary process, cluster workers, and worker threads. Swap the sink here to
 * integrate with any log aggregator without touching call sites (OCP).
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const activeLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function emit(level, message, meta) {
    if (LEVELS[level] > activeLevel) return;
    const entry = {
        ts: new Date().toISOString(),
        level,
        pid: process.pid,
        message,
        ...(meta ? { meta } : {}),
    };
    const line = JSON.stringify(entry);
    if (level === 'error') process.stderr.write(line + '\n');
    else process.stdout.write(line + '\n');
}

export const logger = {
    error: (msg, meta) => emit('error', msg, meta),
    warn: (msg, meta) => emit('warn', msg, meta),
    info: (msg, meta) => emit('info', msg, meta),
    debug: (msg, meta) => emit('debug', msg, meta),
};
