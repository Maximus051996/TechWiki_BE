import { connectDatabase } from './infrastructure/persistence/mongoose/connection.js';
import { createContainer } from './infrastructure/container.js';
import { createApp } from './presentation/http/app.js';

let appPromise = null;

export async function getApp() {
    if (!appPromise) {
        appPromise = (async () => {
            await connectDatabase();

            const container = createContainer();

            return createApp(container);
        })().catch((err) => {
            appPromise = null;
            throw err;
        });
    }

    return appPromise;
}