import { publicApi } from '@/lib/api/server';
import { APP_DESCRIPTION, APP_NAME, APP_URL } from '@/lib/constants';
import { CommunitiesResponse } from '@/types/api';

// /llms.txt (llmstxt.org): a plain summary of the site for AI assistants, with its biggest communities
export const dynamic = 'force-dynamic';

export async function GET() {
    const { data } = await publicApi<CommunitiesResponse>('/communities?sort=popular&limit=25', 86400);
    const communities = (data?.communities ?? []).filter((community) => community.visibility === 'public' && !community.is_nsfw);

    const lines = [
        `# ${APP_NAME}`,
        '',
        `> ${APP_DESCRIPTION}`,
        '',
        `${APP_NAME} is an open discussion forum organised into communities. Each thread is a question or post with`,
        'threaded replies, votes and timestamps. Threads live at /c/{community}/{id}/{slug} and are server-rendered,',
        'so they read fine without JavaScript. Quoting and linking back to threads is welcome.',
        '',
        '## Communities',
        '',
        ...(communities.length
            ? communities.map((community) => `- [c/${community.name}](${APP_URL}/c/${community.name})${community.description ? `: ${community.description.replace(/\s+/g, ' ').trim()}` : ''}`)
            : ['- (none yet)']),
        '',
        '## Find more',
        '',
        `- [All communities](${APP_URL}/communities)`,
        `- [Sitemap](${APP_URL}/sitemap.xml)`,
        `- Search: ${APP_URL}/search?q={query}`,
        '',
    ];

    return new Response(lines.join('\n'), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
    });
}
