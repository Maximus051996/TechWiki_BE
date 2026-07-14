/**
 * Pure CPU-bound task implementations. These run inside worker threads, so they
 * must not touch the DB, network, or any shared mutable state — only transform
 * their input payload and return a result.
 */

const WORDS_PER_MINUTE = 200;

/** Estimate reading time in minutes from rich text / HTML content. */
export function readingTime({ content }) {
    const plain = String(content).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plain ? plain.split(' ').length : 0;
    return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/**
 * Rank grouped search hits by relevance to the term. Exact/prefix matches score
 * higher; ties broken by views then recency.
 */
export function rankSearch({ term, modules, categories, articles, videos }) {
    const t = term.toLowerCase();

    const score = (text = '') => {
        const s = text.toLowerCase();
        if (s === t) return 100;
        if (s.startsWith(t)) return 70;
        if (s.includes(t)) return 40;
        return 10;
    };

    const rank = (arr, nameKey) =>
        [...arr]
            .map((item) => ({
                item,
                _score: score(item[nameKey] ?? '') + Math.min(20, (item.views ?? 0) / 100),
            }))
            .sort((a, b) => b._score - a._score)
            .map(({ item }) => item);

    return {
        modules: rank(modules, 'name'),
        categories: rank(categories, 'name'),
        articles: rank(articles, 'title'),
        videos: rank(videos, 'title'),
    };
}

export const TASKS = { readingTime, rankSearch };
