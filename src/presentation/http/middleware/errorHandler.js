import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/logger/logger.js';
import env from '../../../config/env.js';

/**
 * Central Express error handler. Translates domain/application errors into a
 * consistent JSON envelope. Unknown errors are logged and returned as 500
 * without leaking internals in production.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
    // Mongoose duplicate key -> 409
    if (err?.code === 11000) {
        return res.status(409).json({
            success: false,
            error: { code: 'CONFLICT', message: 'A record with these details already exists' },
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
        });
    }

    logger.error('Unhandled error', { message: err?.message, stack: err?.stack, path: req.path });
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: env.isProduction ? 'An unexpected error occurred' : err?.message,
        },
    });
}

export function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
    });
}
