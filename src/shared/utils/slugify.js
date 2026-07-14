/**
 * Convert an arbitrary string into a URL-safe slug.
 * Pure function — no side effects, easy to test.
 */
export function slugify(input) {
    return String(input)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // strip diacritics
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
