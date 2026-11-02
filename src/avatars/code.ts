// Where a person's picture is. The API sends a code: "y1_hair-afro_skin-sienna" for chosen parts, by name, or "s-1a2b3c"
// for a starter avatar. The code is the picture, so a URL never changes what it shows. Kept tiny: feeds only need this
// file. The options are in parts.ts and the drawings in art.ts.

export type AvatarConfig = Record<string, string>;

export function parseAvatarCode(code: string): AvatarConfig | { starter: string } | null {
    if (/^s-[0-9a-z]{1,8}$/.test(code)) return { starter: code.slice(2) };
    const [version, ...parts] = code.split('_');
    if (version !== 'y1' || !/^[a-z0-9_-]{1,300}$/.test(code)) return null;
    // "hair_colour-1c1619" and "thread_style-fire" hold an underscore of their own
    const config: AvatarConfig = {};
    for (const piece of parts.join('_').matchAll(/(hair_colour|thread_style|[a-z]+)-([a-z0-9-]+)/g)) config[piece[1]] = piece[2];
    return config;
}

// `reply`: the picture a reply uses, with the thread reaching the left edge where the reply line joins it
// Pictures are cached for a year, so bump ART_VERSION whenever the drawings change or browsers keep showing old ones
const ART_VERSION = 3;
export const avatarUrl = (avatar: string, reply = false) => `/avatar/${avatar}${reply ? '.reply' : ''}.svg?v=${ART_VERSION}`;
