import { UnauthorizedError, ForbiddenError } from '../../../shared/errors/AppError.js';
import { Role } from '../../../domain/entities/User.js';

/**
 * Factory producing auth middleware bound to the token service. Only the Admin
 * Portal routes use this — the Customer Portal is fully public (business rule).
 */
export function makeAuthenticate(tokenService) {
    return function authenticate(req, _res, next) {
        const header = req.headers.authorization ?? '';
        const [scheme, token] = header.split(' ');
        if (scheme !== 'Bearer' || !token) {
            return next(new UnauthorizedError('Missing bearer token'));
        }
        try {
            const claims = tokenService.verify(token);
            if (claims.type === 'refresh') throw new Error('refresh token not allowed here');
            req.user = { id: claims.sub, role: claims.role, email: claims.email };
            return next();
        } catch {
            return next(new UnauthorizedError('Invalid or expired token'));
        }
    };
}

/** Guards a route to admins only. */
export function requireAdmin(req, _res, next) {
    if (!req.user || req.user.role !== Role.ADMIN) {
        return next(new ForbiddenError('Admin privileges required'));
    }
    return next();
}
