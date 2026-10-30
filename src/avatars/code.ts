// Drawn avatars: which part of each list makes up a person's picture, as a short code ("31a702546", one base-36
// character per part, in PART_COUNTS order). The API keeps the parts someone chose (Backend src/lib/avatars.ts, same
// order and counts); people who never chose get a picture derived from their username, so everyone looks different
// without anything stored. Kept tiny: feeds only need this file. The drawings are in parts.ts.

export const PART_COUNTS = {
    face: 4,
    skin: 10,
    eyes: 8,
    mouth: 6,
    hair: 12,
    hair_colour: 8,
    accessory: 6,
    outfit: 8,
    background: 8,
} as const;

export type AvatarPart = keyof typeof PART_COUNTS;
export type AvatarConfig = Record<AvatarPart, number>;
export const AVATAR_PARTS = Object.keys(PART_COUNTS) as AvatarPart[];

const CODE = new RegExp(`^[0-9a-z]{${AVATAR_PARTS.length}}$`);

export function encodeAvatar(config: AvatarConfig): string {
    return AVATAR_PARTS.map((part) => config[part].toString(36)).join('');
}

export function decodeAvatar(code: string): AvatarConfig | null {
    if (!CODE.test(code)) return null;
    const config = Object.fromEntries(AVATAR_PARTS.map((part, index) => [part, parseInt(code[index], 36)])) as AvatarConfig;
    return AVATAR_PARTS.every((part) => config[part] < PART_COUNTS[part]) ? config : null;
}

// The same picture for a username every time (FNV-1a, then one slice of the hash per part)
export function avatarFromName(name: string): AvatarConfig {
    let hash = 2166136261;
    for (const char of name.toLowerCase()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    const config = {} as AvatarConfig;
    for (const part of AVATAR_PARTS) {
        config[part] = hash % PART_COUNTS[part];
        hash = Math.imul(hash ^ (hash >>> 13), 2654435761) >>> 0;
    }
    return config;
}

// Where a person's picture is: an SVG the web app draws and the browser caches for good (the URL changes with it)
export function avatarUrl(user: { username: string; avatar?: string | null }): string {
    const code = user.avatar && decodeAvatar(user.avatar) ? user.avatar : encodeAvatar(avatarFromName(user.username));
    return `/avatar/${code}.svg`;
}
