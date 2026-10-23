import { publicApi } from '@/lib/api/server';
import { SITEMAP_REVALIDATE, sitemapIndex, xmlResponse } from '@/lib/sitemap';
import { SitemapIndexResponse } from '@/types/api';

// Sitemap index: static pages, then posts, communities and users in chunks of up to 50,000 URLs
export const dynamic = 'force-dynamic';

export async function GET() {
    const { data } = await publicApi<SitemapIndexResponse>('/seo/sitemap', SITEMAP_REVALIDATE);
    if (!data) return new Response('Sitemap unavailable', { status: 503, headers: { 'Retry-After': '600' } });

    return xmlResponse(
        sitemapIndex([
            { path: '/sitemaps/pages.xml' },
            ...data.posts.map((chunk) => ({ path: `/sitemaps/posts-${chunk.page}.xml`, lastmod: chunk.lastmod })),
            ...data.communities.map((chunk) => ({ path: `/sitemaps/communities-${chunk.page}.xml`, lastmod: chunk.lastmod })),
            ...data.users.map((chunk) => ({ path: `/sitemaps/users-${chunk.page}.xml`, lastmod: chunk.lastmod })),
        ])
    );
}
