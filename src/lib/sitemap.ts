import { APP_URL } from '@/lib/constants';

// Sitemap XML helpers. Data comes from the API's /v1/seo endpoints through publicApi(), which caches each
// response for an hour, so crawlers never trigger a database scan.

export const SITEMAP_REVALIDATE = 3600;

const escapeXml = (value: string) =>
    value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]!);

export type SitemapEntry = { path: string; lastmod?: string | null };

function lastmodTag(lastmod?: string | null) {
    return lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
}

export function urlset(entries: SitemapEntry[]): string {
    const urls = entries.map((entry) => `<url><loc>${escapeXml(`${APP_URL}${entry.path}`)}</loc>${lastmodTag(entry.lastmod)}</url>`);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function sitemapIndex(entries: SitemapEntry[]): string {
    const items = entries.map((entry) => `<sitemap><loc>${escapeXml(`${APP_URL}${entry.path}`)}</loc>${lastmodTag(entry.lastmod)}</sitemap>`);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</sitemapindex>\n`;
}

export function xmlResponse(xml: string, status = 200): Response {
    return new Response(xml, {
        status,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': `public, max-age=${SITEMAP_REVALIDATE}, s-maxage=${SITEMAP_REVALIDATE}, stale-while-revalidate=86400`,
        },
    });
}
