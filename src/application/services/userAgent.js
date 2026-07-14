/**
 * Minimal, dependency-free User-Agent parser. Extracts device type, browser, and
 * OS with lightweight heuristics — good enough for a visitor log without pulling
 * in a heavy UA-parsing library. Pure function; easy to test.
 */
export function parseUserAgent(ua = '') {
    const s = String(ua);
    const lower = s.toLowerCase();

    // Device type
    let deviceType = 'desktop';
    if (/\b(ipad|tablet|kindle|playbook|silk)\b/.test(lower)) deviceType = 'tablet';
    else if (/\b(mobi|iphone|ipod|android.*mobile|windows phone|blackberry)\b/.test(lower)) deviceType = 'mobile';
    else if (/\bbot|crawler|spider|crawling\b/.test(lower)) deviceType = 'bot';

    // Browser (order matters: check specific before generic)
    let browser = 'Unknown';
    if (/edg\//.test(lower)) browser = 'Edge';
    else if (/opr\/|opera/.test(lower)) browser = 'Opera';
    else if (/chrome\//.test(lower) && !/chromium/.test(lower)) browser = 'Chrome';
    else if (/firefox\//.test(lower)) browser = 'Firefox';
    else if (/safari\//.test(lower) && !/chrome/.test(lower)) browser = 'Safari';
    else if (/msie|trident/.test(lower)) browser = 'Internet Explorer';

    // OS
    let os = 'Unknown';
    if (/windows nt 10/.test(lower)) os = 'Windows 10/11';
    else if (/windows nt/.test(lower)) os = 'Windows';
    else if (/android/.test(lower)) os = 'Android';
    else if (/iphone|ipad|ipod/.test(lower)) os = 'iOS';
    else if (/mac os x|macintosh/.test(lower)) os = 'macOS';
    else if (/linux/.test(lower)) os = 'Linux';

    return { deviceType, browser, os };
}

/**
 * Extract the best-guess client IP from an Express request, honouring common
 * proxy headers (X-Forwarded-For) when trust proxy is enabled.
 */
export function extractIp(req) {
    // Prefer proxy headers (always present behind Vercel/Cloud proxies).
    const xff = req.headers?.['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length) {
        return xff.split(',')[0].trim();
    }
    const realIp = req.headers?.['x-real-ip'];
    if (typeof realIp === 'string' && realIp.length) return realIp.trim();

    // Fallback for traditional servers. Guarded so a missing socket (serverless)
    // never throws.
    let ip = '';
    try {
        ip = req.ip || req.socket?.remoteAddress || '';
    } catch {
        ip = '';
    }
    return ip.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
}
