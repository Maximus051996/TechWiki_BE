import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from project root
dotenv.config({
    path: path.resolve(process.cwd(), '.env'),
});

// Temporary Debug Logs (Remove after fixing)
console.log('====================================');
console.log('Working Directory :', process.cwd());
console.log('NODE_ENV          :', process.env.NODE_ENV);
console.log('MONGODB_URI       :', process.env.MONGODB_URI);
console.log('CORS_ORIGINS      :', process.env.CORS_ORIGINS);
console.log('====================================');

function required(name, fallback) {
    const value = process.env[name] ?? fallback;

    if (!value) {
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

    serverless:
        process.env.VERCEL === '1' ||
        process.env.SERVERLESS === 'true',

    port: int('PORT', 4000),

    mongoUri: required(
        'MONGODB_URI',
        'mongodb+srv://sayanp06_db_user:jrfGgf70AZFnfvsm@cluster0.brqjzz9.mongodb.net/techwiki?retryWrites=true&w=majority&appName=Cluster0'
    ),

    jwt: {
        secret: required(
            'JWT_SECRET',
            'GlENgdwFvNF8wDkTR1190jn7F90eK96geoxs5ESKhO6'
        ),

        expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',

        refreshExpiresIn:
            process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },

    corsOrigins: (process.env.CORS_ORIGINS ?? 'https://tech-wiki-fe.vercel.app')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),

    cache: {
        maxItems: int('CACHE_MAX_ITEMS', 1000),
        ttlMs: int('CACHE_TTL_MS', 60000),
    },

    workerPoolSize: int('WORKER_POOL_SIZE', 4),

    geo: {
        enabled: (process.env.GEO_LOOKUP_ENABLED ?? 'true') === 'true',

        url:
            process.env.GEO_LOOKUP_URL ??
            'http://ip-api.com/json',

        timeoutMs: int('GEO_LOOKUP_TIMEOUT_MS', 1500),
    },

    bootstrapAdmin: {
        email: process.env.ADMIN_EMAIL ?? 'admin@techwiki.dev',
        password: process.env.ADMIN_PASSWORD ?? 'Admin@12345',
        name: process.env.ADMIN_NAME ?? 'TechWiki Admin',
    },
};

export default env;