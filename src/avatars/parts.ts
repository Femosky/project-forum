import { AvatarConfig, parseAvatarCode } from './code';
import { BGTONE, Crop, Drawing, drawAvatar, drawStarter, EYEWEAR, FACES, HAIR, NECKS, SKIN, TOPS } from './art';

// Every option an avatar can use. Saved avatars keep names, not positions, so options can be added, reordered or
// retired here at any time, with no API change: a name this file doesn't know simply draws the part's default.

const option = (id: string, name: string, swatch?: string) => ({ id, name, swatch });
const titled = (id: string) => id.replace(/^./, (first) => first.toUpperCase());

const CLOTH = ['27242c', 'f4f4f6', 'ff3b30', 'c8362e', 'e4572e', 'f2b134', 'e8982e', '2f5be0', '1e2a6b', '17243f', '3f6da8', '12a8bd', '6c3fd1', 'd42e8a', '7a1f3a', '7a4b2a'];
const HAIR_COLOURS = ['1c1619', '2d1b14', '4a2b1c', '7a3b1e', 'b9722f', 'dba544', 'ececf0', 'e23d8a', '3f6df0', '8a4de8', 'ff5a3c'];
const THREADS = ['f2b134', 'ff3b30', '2f5be0', '12a8bd', '6c3fd1', 'd42e8a', 'f4f4f6'];
const BACKGROUNDS: Record<string, string> = { blue: '#a9d4ff', coral: '#ffc9a8', violet: '#d9b8ff', amber: '#ffd978', teal: '#8fdde6', pink: '#ffb3c1', slate: '#b5b8ff' };
export const STARTERS: Record<string, string> = { teal: '#12a8bd', blue: '#2b5fe6', violet: '#6a3fd9', pink: '#d42e8a', coral: '#ec4a32', amber: '#f09a14', slate: '#566784', brown: '#a4552a' };
const STARTER_TONES = Object.values(STARTERS);
const THREAD_STYLES = ['fire', 'lightning', 'river', 'iron', 'beads'];

const NATURAL_SKIN = ['midnight', 'espresso', 'ebony', 'umber', 'walnut', 'chestnut', 'sienna', 'caramel', 'honey'];
const FANTASY_SKIN = ['blue', 'purple', 'pink', 'teal', 'gold', 'terracotta', 'bronze', 'iron', 'coralred'];

const EYES: Record<string, Pick<Drawing, 'eyes' | 'eyestyle' | 'glow'>> = {
    warm: {},
    almond: { eyestyle: 'almond' },
    sleepy: { eyestyle: 'sleepy' },
    happy: { eyes: 'happy' },
    wink: { eyes: 'wink' },
    gold: { eyestyle: 'blank', glow: '#ffd35a' },
    white: { eyestyle: 'blank', glow: '#ffffff' },
    ember: { eyestyle: 'blank', glow: '#ff7a2a' },
    sky: { eyestyle: 'blank', glow: '#6fd3ff' },
    cowrie: { eyestyle: 'cowrie' },
    ring: { eyestyle: 'ring' },
    star: { eyestyle: 'star' },
    nok: { eyestyle: 'nok' },
};
// Pale eyes on the darkest skin come too close to the caricatures this design rules out
export const PALE_EYES = ['white', 'cowrie'];
export const DARKEST_SKIN = ['midnight', 'espresso', 'ebony', 'umber', 'walnut'];

export const AVATAR_OPTIONS = {
    skin: { label: 'Skin', options: [...NATURAL_SKIN, ...FANTASY_SKIN].map((id) => option(id, titled(id), SKIN[id])) },
    hair: { label: 'Hair', options: Object.entries(HAIR).map(([id, style]) => option(id, style.name)) },
    hair_colour: { label: 'Hair colour', options: HAIR_COLOURS.map((id) => option(id, id, `#${id}`)) },
    top: { label: 'Wears', options: Object.entries(TOPS).map(([id, style]) => option(id, style.name)) },
    cloth: { label: 'Colour', options: CLOTH.map((id) => option(id, id, `#${id}`)) },
    neck: { label: 'Neck', options: [option('none', 'None'), ...Object.keys(NECKS).filter((id) => id !== 'none').map((id) => option(id, titled(id)))] },
    eyewear: { label: 'Glasses', options: [option('none', 'None'), ...Object.keys(EYEWEAR).map((id) => option(id, titled(id)))] },
    eyes: { label: 'Eyes', options: Object.keys(EYES).map((id) => option(id, titled(id))) },
    mouth: { label: 'Mouth', options: Object.entries(FACES).map(([id, face]) => option(id, face[0])) },
    beard: { label: 'Beard', options: [option('none', 'None'), option('full', 'Beard')] },
    background: { label: 'Background', options: Object.entries(BACKGROUNDS).map(([id, colour]) => option(id, titled(id), BGTONE[colour])) },
    thread: { label: 'Thread', options: THREADS.map((id) => option(id, id, `#${id}`)) },
    thread_style: { label: 'Thread style', options: [option('plain', 'Plain'), ...THREAD_STYLES.map((id) => option(id, titled(id)))] },
};

export type AvatarPart = keyof typeof AVATAR_OPTIONS;

const known = <T>(list: Record<string, T>, id: string | undefined, fallback: string) => (id && Object.hasOwn(list, id) ? id : fallback);

const CLOSE: Crop = [20, 30, 216];
const MEDIUM: Crop = [2, -4, 252];
const FULL: Crop = [-8, -20, 272];
const CLOSE_HAIR = ['bare', 'fade', 'waves', 'cornrows', 'kolese', 'taper', 'sidepart', 'pixie', 'fingerwaves'];
const FULL_HAIR = ['gele', 'gelehigh', 'halo', 'axe', 'iroko'];

// `threadWidth`: replies show at 28px with a 2px line, so the thread is 2/28 of the crop; larger previews pass their own
function toDrawing(config: AvatarConfig, reply: boolean, threadPx: number, sameSize: boolean): Drawing {
    const skin = known(SKIN, config.skin, 'chestnut');
    const hair = known(HAIR, config.hair, 'fade');
    const crop = sameSize ? FULL : CLOSE_HAIR.includes(hair) ? CLOSE : FULL_HAIR.includes(hair) ? FULL : MEDIUM;
    const eyes = PALE_EYES.includes(config.eyes) && DARKEST_SKIN.includes(skin) ? 'warm' : known(EYES, config.eyes, 'warm');
    return {
        skin,
        hair,
        crop,
        hc: HAIR_COLOURS.includes(config.hair_colour) ? `#${config.hair_colour}` : undefined,
        top: known(TOPS, config.top, 'tee'),
        cloth: CLOTH.includes(config.cloth) ? `#${config.cloth}` : '#2f5be0',
        neck: known(NECKS, config.neck, 'none'),
        eyewear: known(EYEWEAR, config.eyewear, '') || undefined,
        ...EYES[eyes],
        mouth: known(FACES, config.mouth, 'smile'),
        beard: config.beard === 'full',
        bg: BACKGROUNDS[config.background] ?? BACKGROUNDS.blue,
        thread: reply ? (THREADS.includes(config.thread) ? `#${config.thread}` : '#f2b134') : undefined,
        threadStyle: THREAD_STYLES.includes(config.thread_style) ? config.thread_style : undefined,
        threadWidth: (threadPx * crop[2]) / 28,
    };
}

// `sameSize`: the editor keeps one crop, so the character doesn't jump as hair changes
const starterPicture = (tone: string, reply: boolean, sameSize = false) => {
    const crop: Crop = sameSize ? FULL : [22, 38, 216];
    return drawStarter({ tone, crop, thread: reply ? tone : undefined, threadWidth: (2 * crop[2]) / 28 });
};

// `sameSize`: the editor keeps one crop, so the character doesn't jump as hair changes
export const renderAvatarConfig = (config: AvatarConfig, reply = false, threadPx = 2, sameSize = false) =>
    STARTERS[config.starter] ? starterPicture(STARTERS[config.starter], reply, sameSize) : drawAvatar(toDrawing(config, reply, threadPx, sameSize));

export function renderAvatar(code: string, reply = false): string | null {
    const parsed = parseAvatarCode(code);
    if (!parsed) return null;
    if ('starter' in parsed && Object.keys(parsed).length === 1 && !STARTERS[parsed.starter]) return starterPicture(STARTER_TONES[parseInt(parsed.starter, 36) % STARTER_TONES.length], reply);
    return renderAvatarConfig(parsed as AvatarConfig, reply);
}

const look = (name: string, hair: string, skin: string, top: string, cloth: string, background: string, extra: AvatarConfig = {}) => ({ name, config: { hair, skin, top, cloth, background, ...extra } });

// Ready-made looks in the editor: heritage first, then modern
export const AVATAR_LOOKS = [
    look('Nok topknot', 'nokknot', 'chestnut', 'hoodie', '27242c', 'violet', { neck: 'nokbeads' }),
    look('Fulani braids', 'fulani', 'sienna', 'tee', 'e8982e', 'blue', { neck: 'cowries' }),
    look('Hausa indigo', 'cowrieband', 'walnut', 'indigo', '1e2a6b', 'coral', { eyes: 'happy' }),
    look('Ife crown', 'ifecrown', 'caramel', 'strip', 'c8362e', 'teal'),
    look('Benin coral', 'benincap', 'umber', 'blazer', '27242c', 'amber', { neck: 'coral' }),
    look('Yoruba threading', 'threaded', 'chestnut', 'strip', '2f5be0', 'blue'),
    look('Uli lines', 'noklobes', 'sienna', 'uli', '6c3fd1', 'pink', { eyes: 'happy' }),
    look('Suku', 'suku', 'chestnut', 'strip', 'c8362e', 'blue'),
    look('Senator', 'taper', 'chestnut', 'senator', '17243f', 'blue', { beard: 'full' }),
    look('Isi agu', 'flattop', 'walnut', 'isiagu', 'c8362e', 'pink'),
    look('Babban riga', 'manbun', 'sienna', 'babbanriga', '1e2a6b', 'amber', { beard: 'full' }),
    look('Iro and buba', 'gele', 'sienna', 'bubairo', 'f2b134', 'teal', { neck: 'amber' }),
    look('Ankara gown', 'silkpress', 'caramel', 'ankaragown', 'd42e8a', 'teal'),
    look('Weekend', 'cap', 'chestnut', 'jersey', '2f5be0', 'teal', { eyewear: 'shades' }),
    look('Office', 'afro', 'chestnut', 'blazer', '17243f', 'violet', { eyewear: 'round' }),
    look('Blue fantasy', 'threaded', 'blue', 'strip', '2f5be0', 'coral', { hair_colour: '1c1619' }),
];
