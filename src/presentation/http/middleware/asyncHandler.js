/**
 * Wraps an async route handler so rejected promises flow to Express's error
 * middleware instead of crashing the process (prevents unhandled rejections /
 * hanging requests that would otherwise leak memory under load).
 */
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
