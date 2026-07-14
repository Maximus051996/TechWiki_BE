/**
 * Base application error. All domain/application errors extend this so the
 * presentation layer can translate them to HTTP responses uniformly.
 */
export class AppError extends Error {
    /**
     * @param {string} message  Human-readable message.
     * @param {number} statusCode  HTTP status code.
     * @param {string} [code]  Machine-readable error code.
     * @param {object} [details]  Optional structured details.
     */
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = undefined) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation failed', details) {
        super(message, 422, 'VALIDATION_ERROR', details);
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Permission denied') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class BusinessRuleError extends AppError {
    constructor(message = 'Operation violates a business rule') {
        super(message, 409, 'BUSINESS_RULE_VIOLATION');
    }
}
