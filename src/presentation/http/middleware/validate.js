import { ValidationError } from '../../../shared/errors/AppError.js';

/**
 * Higher-order middleware that validates a request segment against a Zod schema
 * and replaces it with the parsed (typed, defaulted) value.
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const details = result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
        }));
        return next(new ValidationError('Request validation failed', details));
    }
    req[source] = result.data;
    return next();
};
