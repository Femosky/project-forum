import { renderAvatar } from '@/avatars/parts';

// /avatar/{code}.svg fits the head and hair; {code}.reply.svg adds the thread for replies; {code}.full.svg shows the whole character. The code is the picture, so a URL never changes
// what it shows: browsers and the CDN keep it for a year, and a changed avatar is simply a new URL.
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
    const { file } = await params;
    const match = /^(.+?)(\.reply|\.full)?\.svg$/.exec(file);
    const picture = match && renderAvatar(match[1], match[2] === '.reply', match[2] === '.full');
    if (!picture) return new Response('Not found', { status: 404 });
    return new Response(picture, {
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=31536000, immutable',
            // An SVG opened on its own can't run anything
            'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
        },
    });
}
