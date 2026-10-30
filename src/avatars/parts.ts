import { AvatarConfig } from './code';

// The drawings behind avatars, on a 64 x 64 grid: friendly and simple, flat colours, no outlines except features.
// Every list must keep its order (avatars are stored as positions); new options go at the end, and the counts in
// code.ts and the API's lib/avatars.ts move with them.

const INK = '#1b1b1f';

export const COLOURS = {
    // Light to deep, then two playful ones
    skin: ['#ffe0c7', '#f9d0b0', '#e8b48f', '#d49a6a', '#b57a4f', '#8d5a3b', '#6b4128', '#4a2c1b', '#c8b6ff', '#9ad0f5'],
    hair_colour: ['#1b1b1f', '#3b2417', '#6b4226', '#a0522d', '#e2b66b', '#b8b8c0', '#e879f9', '#60a5fa'],
    outfit: ['#5b5bd6', '#1f2937', '#e11d48', '#f59e0b', '#0ea5e9', '#8b5cf6', '#f472b6', '#64748b'],
    background: ['#e8e6ff', '#ffe3e3', '#dcebff', '#fff1d6', '#2b2d42', '#5b5bd6', '#ffd1c2', '#d9dee6'],
};

const FACES = [
    (skin: string) => `<circle cx="32" cy="29" r="13" fill="${skin}"/>`,
    (skin: string) => `<rect x="19" y="16" width="26" height="27" rx="11" fill="${skin}"/>`,
    (skin: string) => `<ellipse cx="32" cy="29" rx="12" ry="14.5" fill="${skin}"/>`,
    (skin: string) => `<path d="M19 26a13 13 0 0 1 26 0v4c0 8-6 13-13 13s-13-5-13-13z" fill="${skin}"/>`,
];

const stroke = `stroke="${INK}" stroke-width="1.6" stroke-linecap="round" fill="none"`;

const EYES = [
    // Dots
    `<circle cx="27" cy="29" r="1.6" fill="${INK}"/><circle cx="37" cy="29" r="1.6" fill="${INK}"/>`,
    // Tall ovals
    `<ellipse cx="27" cy="29" rx="1.4" ry="2" fill="${INK}"/><ellipse cx="37" cy="29" rx="1.4" ry="2" fill="${INK}"/>`,
    // Happy
    `<path d="M25 29.5q2-2.4 4 0M35 29.5q2-2.4 4 0" ${stroke}/>`,
    // Wink
    `<circle cx="27" cy="29" r="1.6" fill="${INK}"/><path d="M35 29.5q2-2.4 4 0" ${stroke}/>`,
    // Sleepy
    `<path d="M25 29.6h4M35 29.6h4" ${stroke}/>`,
    // Bright, with a shine
    `<circle cx="27" cy="29" r="2.2" fill="${INK}"/><circle cx="37" cy="29" r="2.2" fill="${INK}"/><circle cx="27.8" cy="28.2" r=".7" fill="#fff"/><circle cx="37.8" cy="28.2" r=".7" fill="#fff"/>`,
    // Lashes
    `<circle cx="27" cy="29.4" r="1.5" fill="${INK}"/><circle cx="37" cy="29.4" r="1.5" fill="${INK}"/><path d="M25.4 27.4l-1-1M38.6 27.4l1-1" ${stroke}/>`,
    // Looking aside
    `<circle cx="28.2" cy="29" r="1.6" fill="${INK}"/><circle cx="38.2" cy="29" r="1.6" fill="${INK}"/>`,
];

const MOUTHS = [
    `<path d="M28.5 34.5q3.5 3 7 0" ${stroke}/>`,
    `<path d="M28 34h8q0 4.5-4 4.5T28 34z" fill="${INK}"/><path d="M30 37.6q2-1.2 4 0" stroke="#f472b6" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    `<path d="M29 35.5h6" ${stroke}/>`,
    `<circle cx="32" cy="35.6" r="1.4" ${stroke}/>`,
    `<path d="M29 35.6q3 1.6 6-1.2" ${stroke}/>`,
    `<path d="M30.5 35q1.5 1.2 3 0" ${stroke}/>`,
];

type Hair = { back?: string; front?: string };
const HAIR: ((colour: string) => Hair)[] = [
    // None
    () => ({}),
    // Short crop
    (c) => ({ front: `<path d="M19 27c0-9 6-14 13-14s13 5 13 14c-3-4-7-6-13-6s-10 2-13 6z" fill="${c}"/>` }),
    // Side part
    (c) => ({ front: `<path d="M19 28c-1-10 6-15 14-15 7 0 12 5 12 12-5 0-12-1-17-6-2 4-5 7-9 9z" fill="${c}"/>` }),
    // Curls
    (c) => ({ front: [[21, 22], [26, 17.5], [32, 16], [38, 17.5], [43, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/>`).join('') }),
    // Big round puff
    (c) => ({ back: `<circle cx="32" cy="24" r="19" fill="${c}"/>`, front: `<path d="M20 24c2-6 7-9 12-9s10 3 12 9c-4-2-8-3-12-3s-8 1-12 3z" fill="${c}"/>` }),
    // Top bun
    (c) => ({ front: `<circle cx="32" cy="12" r="5" fill="${c}"/><path d="M19 27c0-9 6-14 13-14s13 5 13 14c-3-4-7-6-13-6s-10 2-13 6z" fill="${c}"/>` }),
    // Long
    (c) => ({
        back: `<path d="M17 28c0-10 6-16 15-16s15 6 15 16v18H17z" fill="${c}"/>`,
        front: `<path d="M19 26c2-7 7-10 13-10s11 3 13 10c-6-2-10-5-13-7-3 2-7 5-13 7z" fill="${c}"/>`,
    }),
    // Bob
    (c) => ({ back: `<path d="M17 30c0-11 7-17 15-17s15 6 15 17v6h-5V26H22v10h-5z" fill="${c}"/>`, front: `<path d="M20 25c2-6 7-9 12-9s10 3 12 9z" fill="${c}"/>` }),
    // Beanie
    (c) => ({ front: `<path d="M18 25c0-9 6-14 14-14s14 5 14 14z" fill="${c}"/><rect x="17" y="22.5" width="30" height="5" rx="2.5" fill="${c}"/><rect x="17" y="22.5" width="30" height="5" rx="2.5" fill="#000" opacity=".15"/>` }),
    // Cap
    (c) => ({ front: `<path d="M19 25c0-8 6-12 13-12s13 4 13 12z" fill="${c}"/><path d="M32 22.6h16q0 3.4-3 3.4H32z" fill="${c}"/><path d="M32 22.6h16q0 3.4-3 3.4H32z" fill="#000" opacity=".18"/>` }),
    // Crop with a headband
    (c) => ({ front: `<path d="M19 27c0-9 6-14 13-14s13 5 13 14c-3-4-7-6-13-6s-10 2-13 6z" fill="${c}"/><rect x="19.5" y="19.5" width="25" height="3" rx="1.5" fill="#fff" opacity=".85"/>` }),
    // Spiky
    (c) => ({ front: `<path d="M19 26l2-8 3 4 2-7 3 5 3-7 3 6 3-5 2 6 3-3 1 9c-4-3-8-4-13-4s-9 1-13 4z" fill="${c}"/>` }),
];

const ACCESSORIES = [
    '',
    `<g stroke="${INK}" stroke-width="1.2" fill="none"><circle cx="27" cy="29" r="3.6"/><circle cx="37" cy="29" r="3.6"/><path d="M30.6 29h2.8"/></g>`,
    `<g stroke="${INK}" stroke-width="1.2" fill="none"><rect x="23" y="26" width="8" height="6" rx="1.5"/><rect x="33" y="26" width="8" height="6" rx="1.5"/><path d="M31 29h2"/></g>`,
    `<circle cx="19.4" cy="33" r="1.4" fill="#f5c542"/><circle cx="44.6" cy="33" r="1.4" fill="#f5c542"/>`,
    `<path d="M17 30a15 15 0 0 1 30 0" stroke="${INK}" stroke-width="2.4" fill="none"/><rect x="15" y="27" width="5" height="9" rx="2.5" fill="${INK}"/><rect x="44" y="27" width="5" height="9" rx="2.5" fill="${INK}"/>`,
    `<g fill="#a0522d" opacity=".55"><circle cx="24.5" cy="33" r=".7"/><circle cx="26.5" cy="34" r=".7"/><circle cx="25" cy="35" r=".7"/><circle cx="39.5" cy="33" r=".7"/><circle cx="37.5" cy="34" r=".7"/><circle cx="39" cy="35" r=".7"/></g>`,
];

// The whole picture as an SVG document (square; pages round it)
export function renderAvatar(config: AvatarConfig): string {
    const skin = COLOURS.skin[config.skin];
    const hair = HAIR[config.hair](COLOURS.hair_colour[config.hair_colour]);
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">`,
        `<rect width="64" height="64" fill="${COLOURS.background[config.background]}"/>`,
        hair.back ?? '',
        `<path d="M12 64c0-11 9-18 20-18s20 7 20 18z" fill="${COLOURS.outfit[config.outfit]}"/>`,
        `<rect x="28" y="38" width="8" height="9" rx="2" fill="${skin}"/>`,
        `<path d="M28.5 46h7l-3.5 4z" fill="${skin}"/>`,
        FACES[config.face](skin),
        hair.front ?? '',
        EYES[config.eyes],
        MOUTHS[config.mouth],
        ACCESSORIES[config.accessory],
        `</svg>`,
    ].join('');
}

// What each option is called in the editor
export const PART_LABELS: Record<keyof AvatarConfig, string> = {
    face: 'Face',
    skin: 'Skin',
    eyes: 'Eyes',
    mouth: 'Mouth',
    hair: 'Hair',
    hair_colour: 'Hair colour',
    accessory: 'Extras',
    outfit: 'Top',
    background: 'Background',
};
