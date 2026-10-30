import { describe, expect, it } from 'vitest';
import { GLYPHS } from './communityIconGlyphs';
import { ICON_GLYPHS, suggestIcons } from './communityIcons';

describe('community icons', () => {
    it('has a drawing for every icon', () => {
        expect(ICON_GLYPHS.filter((glyph) => !GLYPHS[glyph.name])).toEqual([]);
    });

    it.each([
        ['LagosRent', 'Rent, landlords and housing', 'house'],
        ['SuperEagles', 'Nigerian football', 'football'],
        ['Japa', 'Visas and moving abroad', 'plane'],
        ['Afrobeats', null, 'music'],
    ])('suggests for %s', (name, description, icon) => {
        expect(suggestIcons(name, description)[0].name).toBe(icon);
    });

    it('suggests nothing rather than guessing', () => {
        expect(suggestIcons('Zzz', 'Qwerty')).toEqual([]);
    });
});
