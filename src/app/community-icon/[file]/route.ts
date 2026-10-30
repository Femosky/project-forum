import { GLYPHS } from '@/data/communityIconGlyphs';
import { ICON_COLOURS, IconColour } from '@/data/communityIcons';

// /community-icon/{glyph}-{colour}.svg: a line drawing on a soft tint. The address is the picture, so there's nothing
// to store and it can be cached for a year.
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
    const { file } = await params;
    const [, glyph, colour] = file.match(/^([a-z]+)-([a-z]+)\.svg$/) ?? [];
    const tint = ICON_COLOURS[colour as IconColour];
    if (!GLYPHS[glyph] || !tint) return new Response('Not found', { status: 404 });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="${tint.background}"/><g transform="translate(11 11) scale(1.0833)" fill="none" stroke="${tint.line}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[glyph]}</g></svg>`;
    return new Response(svg, {
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=31536000, immutable',
            // An SVG opened on its own can't run anything
            'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
        },
    });
}
