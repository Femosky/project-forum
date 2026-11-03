import { communityIconSvg } from '@/lib/communityIcon';

// /community-icon/{glyph}-{colour}.svg: a line drawing on a soft tint. The address is the picture, so there's nothing
// to store and it can be cached for a year.
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
    const { file } = await params;
    const svg = communityIconSvg(file);
    if (!svg) return new Response('Not found', { status: 404 });
    return new Response(svg, {
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=31536000, immutable',
            // An SVG opened on its own can't run anything
            'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
        },
    });
}
