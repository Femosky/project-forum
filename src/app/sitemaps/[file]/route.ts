import { publicApi } from '@/lib/api/server';
import { SITEMAP_REVALIDATE, SitemapEntry, urlset, xmlResponse } from '@/lib/sitemap';

// /sitemaps/pages.xml, /sitemaps/posts-{n}.xml, /sitemaps/communities-{n}.xml, /sitemaps/users-{n}.xml
export const dynamic = 'force-dynamic';

type ChunkResponse = {
    urls: { community?: string; short_id?: string; slug?: string; name?: string; username?: string; lastmod: string | null }[];
};

const STATIC_PAGES: SitemapEntry[] = [{ path: '/' }, { path: '/trending' }, { path: '/communities' }];

function pathFor(kind: string, url: ChunkResponse['urls'][number]): string {
    if (kind === 'posts') return `/c/${url.community}/${url.short_id}${url.slug ? `/${url.slug}` : ''}`;
    if (kind === 'communities') return `/c/${url.name}`;
    return `/u/${url.username}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
    const { file } = await params;
    if (file === 'pages.xml') return xmlResponse(urlset(STATIC_PAGES));

    const match = /^(posts|communities|users)-(\d{1,5})\.xml$/.exec(file);
    if (!match) return new Response('Not found', { status: 404 });
    const [, kind, page] = match;

    const { data, status } = await publicApi<ChunkResponse>(`/seo/sitemap/${kind}/${page}`, SITEMAP_REVALIDATE);
    if (!data) return new Response(status === 404 ? 'Not found' : 'Sitemap unavailable', { status: status === 404 ? 404 : 503 });

    return xmlResponse(urlset(data.urls.map((url) => ({ path: pathFor(kind, url), lastmod: url.lastmod }))));
}
