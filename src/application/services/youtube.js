/**
 * Extract a YouTube video id from any of the common URL shapes. Returns null when
 * the URL is not a valid YouTube link. Used to enforce the "valid YouTube URL"
 * business rule and to derive thumbnails.
 */
export function extractYouTubeId(url) {
    if (typeof url !== 'string') return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
        /(?:youtu\.be\/)([\w-]{11})/,
        /(?:youtube\.com\/embed\/)([\w-]{11})/,
        /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    ];
    for (const re of patterns) {
        const match = url.match(re);
        if (match) return match[1];
    }
    return null;
}

export function youtubeThumbnail(videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
