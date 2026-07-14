import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, validated environment configuration.
 * Single source of truth for all runtime settings (SRP).
 */
function required(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (value === undefined || value === '') {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function int(name, fallback) {
    const raw = process.env[name];
    const value = raw === undefined || raw === '' ? fallback : Number(raw);
    if (!Number.isFinite(value)) {
        throw new Error(`Environment variable ${name} must be a number`);
    }
    return value;
}

const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
    port: int('PORT', 4000),

    mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/techwiki'),

    jwt: {
        secret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
        expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },

    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),

    cache: {
        maxItems: int('CACHE_MAX_ITEMS', 1000),
        ttlMs: int('CACHE_TTL_MS', 60_000),
    },

    workerPoolSize: int('WORKER_POOL_SIZE', 4),

    geo: {
        enabled: (process.env.GEO_LOOKUP_ENABLED ?? 'true') === 'true',
        url: process.env.GEO_LOOKUP_URL ?? 'http://ip-api.com/json',
        timeoutMs: int('GEO_LOOKUP_TIMEOUT_MS', 1500),
    },

    bootstrapAdmin: {
        email: process.env.ADMIN_EMAIL ?? 'admin@techwiki.dev',
        password: process.env.ADMIN_PASSWORD ?? 'Admin@12345',
        name: process.env.ADMIN_NAME ?? 'TechWiki Admin',
    },
};

export default env;
