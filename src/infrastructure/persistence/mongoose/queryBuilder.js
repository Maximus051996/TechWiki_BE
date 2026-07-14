/**
 * Translates application-level list queries into Mongoose filter + sort objects.
 * Centralised so every repository sorts and filters consistently.
 */
export function buildSort(sort) {
    switch (sort) {
        case 'popular':
            return { views: -1, publishedDate: -1 };
        case 'alphabetical':
            return { name: 1, title: 1 };
        case 'latest':
        default:
            return { publishedDate: -1, createdAt: -1 };
    }
}

export function buildFilter(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.moduleId) filter.moduleId = query.moduleId;
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (typeof query.featured === 'boolean') filter.featured = query.featured;
    if (query.q) {
        const rx = new RegExp(escapeRegExp(query.q), 'i');
        filter.$or = [{ name: rx }, { title: rx }, { tags: rx }];
    }
    return filter;
}

export function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function pagination(query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    return { page, limit, skip: (page - 1) * limit };
}
