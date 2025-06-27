/**
 * Extracts the Vimeo ID from a Vimeo URL
 * @param url The Vimeo URL to extract the ID from
 * @returns The Vimeo ID if found, null otherwise
 */
export function extractVimeoId(url: string): string | null {
    if (!url) return null;
    
    // Match patterns like:
    // - https://vimeo.com/123456789
    // - https://player.vimeo.com/video/123456789
    // - vimeo.com/123456789
    const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    return match ? match[1] : null;
} 