import { GLYPHS } from '@/data/communityIconGlyphs';
import { ICON_COLOURS, IconColour } from '@/data/communityIcons';

// A drawn community icon ({glyph}-{colour}.svg): a line drawing on a soft tint. Served by app/community-icon and
// drawn straight into share images.
export function communityIconSvg(file: string): string | null {
    const [, glyph, colour] = file.match(/^([a-z]+)-([a-z]+)\.svg$/) ?? [];
    const tint = ICON_COLOURS[colour as IconColour];
    if (!GLYPHS[glyph] || !tint) return null;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="${tint.background}"/><g transform="translate(11 11) scale(1.0833)" fill="none" stroke="${tint.line}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[glyph]}</g></svg>`;
}
