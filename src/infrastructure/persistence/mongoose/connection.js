import mongoose from 'mongoose';
import env from '../../../config/env.js';
import { logger } from '../../../shared/logger/logger.js';

/**
 * Manages the single shared Mongoose connection. The connection pool is tuned so
 * a single worker can serve many concurrent readers without exhausting sockets.
 */
mongoose.set('strictQuery', true);

let connectingPromise = null;

export async function connectDatabase() {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (connectingPromise) return connectingPromise;

    connectingPromise = mongoose
        .connect(env.mongoUri, {
            // Serverless: keep the pool tiny (many concurrent function instances
            // each open their own pool, so a large pool exhausts Atlas limits).
            maxPoolSize: env.serverless ? 5 : 50,
            minPoolSize: env.serverless ? 0 : 5,
            serverSelectionTimeoutMS: 5_000,
            socketTimeoutMS: 45_000,
        })
        .then((m) => {
            logger.info('MongoDB connected', { host: m.connection.host });
            return m.connection;
        })
        .catch((err) => {
            connectingPromise = null;
            throw err;
        });

    return connectingPromise;
}

export async function disconnectDatabase() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
    }
}

export { mongoose };
