/**
 * Vercel serverless entry point.
 *
 * Vercel runs each request as a serverless function (no long-lived process, no
 * app.listen, no clustering). We build the Express app once per warm instance
 * and reuse the cached Mongo connection + DI container across invocations.
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
            // Reset so the next invocation can retry a failed cold start.
            appPromise = null;
            throw err;
        });
    }
    return appPromise;
}

export default async function handler(req, res) {
    const app = await getApp();
    return app(req, res);
}
