/**
 * Lightweight paginated-result helper used by list use cases so the presentation
 * layer receives a consistent envelope for every collection endpoint.
 */
export function paginated({ items, total, page, limit }) {
    const safeLimit = Math.max(1, limit);
    return {
        items,
        pagination: {
            total,
            page,
            limit: safeLimit,
            totalPages: Math.max(1, Math.ceil(total / safeLimit)),
            hasNext: page * safeLimit < total,
            hasPrev: page > 1,
        },
    };
}
