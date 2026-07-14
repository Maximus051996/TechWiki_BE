/**
 * Vercel serverless entry point.
 *
 * Vercel runs each request as a serverless function (no long-lived process, no
 * app.listen, no clustering). We build the Express app once per warm instance
 * and reuse the cached Mongo connection + DI container across invocations.
 *
 * Defensive: if the cold start fails (e.g. DB unreachable), we still return a
 * readable JSON error WITH CORS headers instead of an opaque platform 500 —
 * otherwise the browser misreports the crash as a CORS error.
 */
import { connectDatabase } from '../src/infrastructure/persistence/mongoose/connection.js';
import { createContainer } from '../src/infrastructure/container.js';
import { createApp } from '../src/presentation/http/app.js';

let appPromise = null;

async function getApp() {
    if (!appPromise) {
        appPromise = (async () => {
            await connectDatabase();
            const container = createContainer();
            return createApp(container);
        })().catch((err) => {
            appPromise = null; // allow retry on the next invocation
            throw err;
        });
    }
    return appPromise;
}

function applyCors(req, res) {
    const allowed = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    const origin = req.headers.origin;
    if (origin && (allowed.length === 0 || allowed.includes(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Refresh-Token');
}

export default async function handler(req, res) {
    // Always apply CORS
    applyCors(req, res);

    // Handle browser preflight request
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        const app = await getApp();
        return app(req, res);
    } catch (err) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;

        res.end(
            JSON.stringify({
                success: false,
                error: {
                    code: 'STARTUP_FAILED',
                    message: err?.message || 'Server failed to start',
                    hint: 'Check MONGODB_URI env var and MongoDB Atlas Network Access.',
                },
            })
        );
    }
}
