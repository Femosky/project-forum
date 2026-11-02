// The Yarner: one rounded creature, one bold outline, one personal thread, on a 256 grid. This file only draws: parts.ts
// lists the options and turns a saved avatar into these drawings. Only the /avatar route, the share images and the
// lazy editor load it, so feeds pay nothing for the art.

export type Cloth = { c: string; lt: string };
type Layers = { back?: string; front?: string };
export type HairStyle = { name: string; draw: (h: string, l: string, o: Cloth, thread: string) => Layers };
export type TopStyle = { name: string; fill?: string; draw: (o: Cloth) => string };
export type Drawing = {
    skin: string;
    hair: string;
    hc?: string;
    top: string;
    cloth: string;
    neck?: string;
    eyewear?: string;
    eyes?: string;
    eyestyle?: string;
    glow?: string;
    mouth: string;
    beard?: boolean;
    bg: string;
    thread?: string;
    threadStyle?: string;
    threadWidth?: number;
    crop: Crop;
};

// The Yarner: one rounded creature, one bold outline, one personal thread. 256 grid.
const INK = '#17151a', OUT = 3.2;
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
let uid = 0;
// Inked and shaded: a heavier line on the lower right, and a cel shadow from the same shapes nudged up and left
const ol = (s: string, f: string) => {
    const id = `s${++uid}`, flat = f.startsWith('url');
    const ink = (x: number, y: number) => `<g transform="translate(${x} ${y})" fill="${INK}" stroke="${INK}" stroke-width="${OUT * 2}" stroke-linejoin="round" stroke-linecap="round">${s}</g>`;
    const body = flat ? `<g fill="${f}">${s}</g>` : `<clipPath id="${id}">${s}</clipPath><g fill="${mix(f, '#1a0f24', 0.3)}">${s}</g><g clip-path="url(#${id})"><g fill="${f}" transform="translate(-5 -7)">${s}</g><g fill="${mix(f, '#ffffff', 0.2)}" transform="translate(-11 -15)" opacity=".5">${s}</g></g>`;
    return ink(1.5, 2.5) + ink(0, 0) + body;
};
const c = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const ring = (cx: number, cy: number, rx: number, ry: number, n: number, r: number, a0 = 0, a1 = 360) => Array.from({ length: n }, (_, i) => { const a = ((a0 + (i / (a1 - a0 < 360 ? n - 1 : n)) * (a1 - a0)) * Math.PI) / 180; return c(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), r); }).join('');
const rope = (d: string, w: number, col: string) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + OUT * 2}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${mix(col, '#1a0f24', 0.3)}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w * 0.62}" stroke-linecap="round" transform="translate(-1 -1)"/><path d="${d}" fill="none" stroke="#fff" stroke-width="${Math.max(1, w * 0.14)}" stroke-linecap="round" stroke-dasharray="8 14" opacity=".55" transform="translate(-1.6 -1.6)"/>`;
const ln = (d: string, w = 3.5, col = INK) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const BODY = 'M76 112C76 72 98 50 128 50C158 50 180 72 180 112V192C180 218 158 232 128 232C98 232 76 218 76 192Z';
const CAP = 'M71 104C70 66 96 44 128 44C160 44 186 66 185 104C170 86 150 80 128 80C106 80 86 86 71 104Z';
const cap = (col: string, extra = '') => ol(`<path d="${CAP}"/>${extra}`, col);
export const HAIR: Record<string, HairStyle> = {
    afro: { name: 'Afro', draw: (h) => ({ back: ol(c(128, 80, 72) + ring(128, 80, 74, 68, 12, 20), h), front: cap(h, ring(128, 70, 48, 16, 5, 13, 200, 340)) }) },
    puffs: { name: 'Two puffs', draw: (h) => ({ back: ol(c(62, 58, 28) + c(194, 58, 28) + ring(62, 58, 22, 22, 7, 12) + ring(194, 58, 22, 22, 7, 12), h), front: cap(h) + ln('M128 46V78') }) },
    knots: { name: 'Bantu knots', draw: (h, l) => { const p = [[128, 30], [88, 42], [168, 42], [66, 76], [190, 76]]; return { front: cap(h) + ol(p.map(([x, y]) => c(x, y, 16)).join(''), h) + p.map(([x, y]) => `<path d="M${x - 7} ${y}a7 7 0 1 1 7 7" fill="none" stroke="${l}" stroke-width="3" stroke-linecap="round"/>`).join('') }; } },
    cornrows: { name: 'Cornrows', draw: (h, l) => ({ front: cap(h) + [-3, -2, -1, 0, 1, 2, 3].map((i) => `<path d="M${128 + i * 15} 80Q${128 + i * 11} 62 ${128 + i * 7} 50" fill="none" stroke="${l}" stroke-width="4" stroke-dasharray="3 6" stroke-linecap="round"/>`).join('') }) },
    locs: { name: 'Locs', draw: (h) => ({ back: [-3, -2, 2, 3].map((i) => rope(`M${128 + i * 20} 74C${128 + i * 22} 110 ${128 + i * 21} 140 ${128 + i * 20} 168`, 13, h)).join(''), front: cap(h) }) },
    braids: { name: 'Long braids', draw: (h, l) => { const r = (i: number) => rope(`M${128 + i * 20} 74C${128 + i * 23} 120 ${128 + i * 22} 170 ${128 + i * 21} 208`, 11, h) + `<path d="M${128 + i * 20} 74C${128 + i * 23} 120 ${128 + i * 22} 170 ${128 + i * 21} 208" fill="none" stroke="${l}" stroke-width="11" stroke-dasharray="2.5 9"/>`; return { back: [-3, -2, 2, 3].map(r).join(''), front: cap(h) }; } },
    threaded: { name: 'Threaded', draw: (h, l, o, t) => { const st = (x: number, tip: number) => rope(`M${x} 66Q${x + (tip - x) * 0.3} 40 ${tip} 8`, 10, h) + `<path d="M${x} 66Q${x + (tip - x) * 0.3} 40 ${tip} 8" fill="none" stroke="${t}" stroke-width="10" stroke-dasharray="3 5"/>`; return { front: [[92, 62], [110, 96], [128, 128], [146, 160], [164, 194]].map(([x, tip]) => st(x, tip)).join('') + cap(h) }; } },
    fade: { name: 'Fade', draw: (h) => ({ front: `<path d="${CAP}" fill="${INK}" stroke="${INK}" stroke-width="${OUT}"/>` + `<path d="${CAP}" fill="${h}"/>` }) },
    waves: { name: 'Waves', draw: (h, l) => ({ front: cap(h) + ln('M90 74Q128 52 166 74M104 60Q128 50 152 60', 3.5, l) }) },
    gele: { name: 'Gele', draw: (h, l, o) => ({ front: ol([-52, -26, 0, 26, 52].map((a) => `<path d="M128 78C104 58 106 12 128 0C150 12 152 58 128 78Z" transform="rotate(${a} 128 80)"/>`).join(''), o.c) + [-39, -13, 13, 39].map((a) => `<path d="M128 72V14" transform="rotate(${a} 128 80)" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`).join('') + cap(o.lt) }) },
    fila: { name: 'Fila', draw: (h, l, o) => ({ front: ol('<path d="M74 92C72 52 98 34 130 34C160 34 196 38 208 64C208 74 196 76 188 72C186 80 184 88 182 92C150 78 106 78 74 92Z"/>', o.c) + ln('M138 36C162 40 180 54 188 72') }) },
    wrap: { name: 'Headwrap', draw: (h, l, o) => ({ front: ol(`<path d="${CAP}"/>${c(128, 36, 16)}${c(106, 38, 13)}${c(150, 38, 13)}`, o.c) + ln('M112 50Q118 66 112 78M144 50Q138 66 144 78') }) },
};
HAIR.nokknot = { name: 'Nok topknot', draw: (h, l) => ({ front: ol(`<path d="M104 56C102 26 116 8 128 4C140 8 154 26 152 56Z"/>`, h) + ln('M108 34Q128 26 148 34M106 44Q128 36 150 44', 3, l) + cap(h) + ln('M80 90Q128 62 176 90M88 76Q128 52 168 76', 3, l) }) };
HAIR.noklobes = { name: 'Nok lobes', draw: (h, l) => ({ front: ol(c(84, 44, 26) + c(128, 30, 28) + c(172, 44, 26), h) + ln('M66 44Q84 30 102 44M108 30Q128 16 148 30M154 44Q172 30 190 44', 3, l) + cap(h) + ln('M128 46V78', 3, l) }) };
HAIR.benincap = { name: 'Bead net cap', draw: (h, l, o) => { const coral = '#d9533f', bead = Array.from({ length: 6 }, (_, r) => Array.from({ length: 12 - Math.abs(r - 2) }, (_, i) => `<circle cx="${84 + i * 8 + Math.abs(r - 2) * 4}" cy="${50 + r * 7}" r="3"/>`).join('')).join(''); return { front: ol(`<path d="${CAP}"/>`, coral) + `<g fill="#f6b8a6">${bead}</g>` + [-1, 1].map((s) => `<path d="M${128 + s * 50} 90V146M${128 + s * 41} 92V136" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M${128 + s * 50} 90V146M${128 + s * 41} 92V136" stroke="${coral}" stroke-width="6" stroke-dasharray="1 8" stroke-linecap="round"/>`).join('') }; } };
HAIR.ifecrown = { name: 'Tube-bead crown', draw: (h, l, o) => ({ front: `<path d="M128 40C124 22 128 8 138 2C140 14 138 28 134 40Z" fill="#e8b84a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` + ol(`<path d="M71 100C70 62 96 42 128 42C160 42 186 62 185 100C166 84 90 84 71 100Z"/>`, '#c98a3a') + [0, 1, 2, 3].map((r) => `<path d="M${76 + r * 7} ${90 - r * 11}Q128 ${62 - r * 11} ${180 - r * 7} ${90 - r * 11}" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="9 3"/>`).join('') + ol(c(128, 58, 11), '#e8b84a') + c(128, 58, 4).replace('/>', ` fill="${INK}"/>`) }) };
HAIR.bare = { name: 'Bare', draw: () => ({}) };
HAIR.horns = { name: 'Ram horns', draw: (h, l) => ({ front: ol('<path d="M92 66C60 62 40 84 54 108C60 118 74 116 74 104C66 96 72 84 98 84Z"/><path d="M164 66C196 62 216 84 202 108C196 118 182 116 182 104C190 96 184 84 158 84Z"/>', '#ece2cf') + ln('M62 86L72 92M56 98L68 100M194 86L184 92M200 98L188 100', 2.4) + cap(h) }) };
HAIR.axe = { name: 'Double-axe crest', draw: (h, l) => ({ front: cap(h) + ol('<rect x="123" y="4" width="10" height="48" rx="3"/><path d="M128 14C112 2 90 4 84 16C88 26 88 36 84 46C94 54 114 46 128 34Z"/><path d="M128 14C144 2 166 4 172 16C168 26 168 36 172 46C162 54 142 46 128 34Z"/>', '#d7dbe4') }) };
HAIR.halo = { name: 'Brass halo', draw: (h, l) => ({ back: ol('<circle cx="128" cy="86" r="86"/>', '#e8b84a') + `<circle cx="128" cy="86" r="70" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="3 9"/>`, front: cap(h) + ol(c(128, 40, 18), h) }) };
HAIR.hightop = { name: 'High top', draw: (h, l) => ({ front: ol(`<path d="${CAP}"/><path d="M84 84L92 18H164L172 84Z"/>`, h) + ln('M100 30H156M98 44H158', 2.6, l) }) };
HAIR.twists = { name: 'Twists', draw: (h, l) => ({ front: [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => rope(`M${128 + i * 11} 66Q${128 + i * 14} 44 ${128 + i * 17} ${28 + Math.abs(i) * 5}`, 10, h)).join('') + cap(h) }) };
HAIR.bun = { name: 'Top bun', draw: (h, l) => ({ front: ol(c(128, 32, 22), h) + ln('M114 30Q128 18 142 30', 2.8, l) + cap(h) }) };
HAIR.sidepart = { name: 'Line-up', draw: (h, l) => ({ front: cap(h) + ln('M92 74L118 58', 3.4, '#f4f4f6') }) };
HAIR.cap = { name: 'Cap', draw: (h, l, o) => ({ front: ol('<path d="M74 92C70 50 98 34 128 34C158 34 186 50 182 92C150 78 106 78 74 92Z"/><path d="M128 84C150 80 186 84 216 100C218 104 216 106 212 106C176 94 150 92 128 96Z"/>', o.c) + ln('M128 34V82', 2.6) }) };
HAIR.beanie = { name: 'Beanie', draw: (h, l, o) => ({ front: ol('<path d="M74 74C70 36 98 18 128 18C158 18 186 36 182 74Z"/>', o.c) + ol('<rect x="68" y="60" width="120" height="24" rx="10"/>', o.lt) + [88, 108, 128, 148, 168].map((x) => ln(`M${x} 66V78`, 2.8)).join('') }) };
HAIR.bucket = { name: 'Bucket hat', draw: (h, l, o) => ({ front: ol('<path d="M84 92L92 42C106 30 150 30 164 42L172 92Z"/><path d="M84 88C64 96 52 108 50 112C100 96 156 96 206 112C204 108 192 96 172 88C144 82 112 82 84 88Z"/>', o.c) }) };
HAIR.moon = { name: 'Crescent moon', draw: (h, l) => ({ front: cap(h) + ol('<path d="M92 34C96 62 160 62 164 34C154 46 102 46 92 34Z"/>', '#eef0ff') }) };
HAIR.hunter = { name: 'Hunter hat', draw: (h, l, o) => ({ back: ol('<path d="M150 38C184 36 196 66 186 104C176 92 168 74 150 62Z"/>', '#26242c'), front: ol('<path d="M74 96C70 58 92 42 104 18C118 8 146 8 156 22C176 46 186 62 182 96C150 82 106 82 74 96Z"/>', '#26242c') + ln('M78 92C106 80 150 80 178 92', 2.6, '#8a7a5a') }) };
HAIR.cowriecrown = { name: 'Cowrie crown', draw: (h, l, o) => ({ front: ol(`<path d="${CAP}"/>`, '#f4f4f6') + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = Math.PI * (1.08 + (i / 7) * 0.84); return cowrie(Math.round(128 + Math.cos(a) * 50), Math.round(92 + Math.sin(a) * 38), 0); }).join('') + [0, 1, 2].map((i) => cowrie(112 + i * 16, 42 - (i === 1 ? 6 : 0), 0)).join('') }) };
HAIR.iroko = { name: 'Iroko crown', draw: (h, l) => ({ front: [-54, -30, -8, 14, 36, 58].map((a, i) => `<g transform="rotate(${a} 128 86)">${ol('<path d="M128 66C114 46 118 14 128 4C138 14 142 46 128 66Z"/>', i % 2 ? '#2f8f6b' : '#3fae82')}</g>`).join('') + cap(h) }) };
HAIR.suku = { name: 'Suku', draw: (h, l) => ({ front: ol(c(128, 26, 26), h) + ln('M108 26Q128 8 148 26M110 36Q128 22 146 36', 2.8, l) + cap(h) + [-3, -2, -1, 0, 1, 2, 3].map((i) => `<path d="M${128 + i * 15} 80Q${128 + i * 11} 58 ${128 + i * 5} 40" fill="none" stroke="${l}" stroke-width="4" stroke-dasharray="3 6" stroke-linecap="round"/>`).join('') }) };
HAIR.koroba = { name: 'Koroba', draw: (h, l) => { const rim = [0, 1, 2, 3, 4, 5, 6].map((i) => { const x = 86 + i * 14; return ol(c(x, 26 + Math.abs(3 - i) * 2, 7), '#e8982e'); }).join(''); return { front: `${[-3, -2, -1, 0, 1, 2, 3].map((i) => rope(`M${128 + i * 15} 80Q${128 + i * 19} 54 ${128 + i * 14} ${28 + Math.abs(i) * 2}`, 9, h)).join('')}${cap(h)}${rim}` }; } };
HAIR.kolese = { name: 'Kolese', draw: (h, l) => ({ front: cap(h) + [-3, -2, -1, 0, 1, 2, 3].map((i) => `<path d="M${128 + i * 15} 80C${128 + i * 14} 70 ${128 + i * 12} 58 ${128 + i * 9} 50" fill="none" stroke="${l}" stroke-width="4" stroke-dasharray="3 6" stroke-linecap="round"/>`).join('') }) };
HAIR.frohawk = { name: 'Frohawk', draw: (h, l) => ({ front: `<path d="${CAP}" fill="${mix(h, '#8a5236', 0.25)}" stroke="${INK}" stroke-width="5"/>` + ol(c(128, 40, 20) + c(128, 58, 18) + c(108, 56, 12) + c(148, 56, 12) + c(128, 22, 15), h) + ln('M116 36Q128 24 140 36', 2.6, l) }) };
HAIR.ponytail = { name: 'Ponytail', draw: (h, l) => ({ back: rope('M170 70C210 70 214 120 196 158', 22, h), front: cap(h) + ln('M104 62Q132 48 164 66', 3, l) }) };
HAIR.pigtails = { name: 'Low buns', draw: (h, l) => ({ back: ol(c(62, 120, 22) + c(194, 120, 22), h), front: cap(h) + ln('M128 46V78', 3) + ln('M50 118Q62 104 74 118M182 118Q194 104 206 118', 2.6, l) }) };
HAIR.mohawk = { name: 'Fade mohawk', draw: (h, l) => ({ front: `<path d="${CAP}" fill="${mix(h, '#8a5236', 0.4)}" stroke="${INK}" stroke-width="5"/>` + ol('<path d="M106 80C100 56 104 24 128 12C152 24 156 56 150 80Z"/>', h) + ln('M118 34Q128 22 138 34M116 50Q128 38 140 50', 2.6, l) }) };
HAIR.fingerwaves = { name: 'Finger waves', draw: (h, l) => ({ front: cap(h) + ln('M84 92C96 78 106 92 118 80S142 66 150 78S170 92 176 84M92 72C104 60 114 74 126 62S150 52 160 62', 3.4, l) }) };
HAIR.bigcurls = { name: 'Big curls', draw: (h, l) => ({ back: ol(c(128, 60, 58) + ring(128, 66, 66, 52, 12, 18), h), front: cap(h, ring(128, 70, 48, 16, 5, 13, 200, 340)) + [[80, 50], [110, 28], [146, 28], [178, 50], [64, 88], [192, 88]].map(([x, y]) => `<path d="M${x - 7} ${y}a7 7 0 1 1 7 7" fill="none" stroke="${l}" stroke-width="3" stroke-linecap="round"/>`).join('') }) };
HAIR.locbun = { name: 'Locs bun', draw: (h, l) => ({ front: [-3, -2, -1, 1, 2, 3].map((i) => rope(`M${128 + i * 12} 40C${128 + i * 16} 20 ${128 - i * 6} 10 ${128 - i * 12} 26`, 9, h)).join('') + cap(h) + [-2, -1, 0, 1, 2].map((i) => ln(`M${128 + i * 20} 78Q${128 + i * 15} 62 ${128 + i * 8} 50`, 2.6, l)).join('') }) };
HAIR.sidebraid = { name: 'Side braid', draw: (h, l) => ({ back: rope('M84 80C60 110 60 150 70 176', 14, h) + `<path d="M84 80C60 110 60 150 70 176" fill="none" stroke="${l}" stroke-width="14" stroke-dasharray="2.5 9"/>`, front: cap(h) + ln('M150 50Q118 58 84 92', 3.4, l) }) };
HAIR.shortlocs = { name: 'Short locs', draw: (h, l) => ({ front: [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => rope(`M${128 + i * 12} 46Q${128 + i * 19} 40 ${128 + i * 22} ${26 + Math.abs(i) * 8}`, 11, h)).join('') + cap(h) }) };
HAIR.taper = { name: 'Taper fade', draw: (h, l) => ({ front: `<path d="${CAP}" fill="${mix(h, '#8a5236', 0.35)}" stroke="${INK}" stroke-width="5"/>` + ol('<path d="M82 78C84 50 106 38 128 38C150 38 172 50 174 78C150 68 106 68 82 78Z"/>', h) + ln('M100 56Q128 44 156 56', 2.6, l) }) };
HAIR.flattop = { name: 'Flat top', draw: (h, l) => ({ front: `<path d="${CAP}" fill="${mix(h, '#8a5236', 0.35)}" stroke="${INK}" stroke-width="5"/>` + ol('<path d="M84 80L88 34H168L172 80Z"/>', h) + ln('M96 46H160', 2.6, l) }) };
HAIR.dreadfade = { name: 'Fade with locs', draw: (h, l) => ({ front: `<path d="${CAP}" fill="${mix(h, '#8a5236', 0.35)}" stroke="${INK}" stroke-width="5"/>` + [-3, -2, -1, 0, 1, 2, 3].map((i) => rope(`M${128 + i * 11} 62Q${128 + i * 15} 46 ${128 + i * 26} ${34 + Math.abs(i) * 9}`, 10, h)).join('') }) };
HAIR.manbun = { name: 'Locs man bun', draw: (h, l) => ({ front: ol(c(128, 34, 20), h) + ln('M114 32Q128 20 142 32', 2.6, l) + `<path d="${CAP}" fill="${mix(h, '#8a5236', 0.3)}" stroke="${INK}" stroke-width="5"/>` + [-2, -1, 0, 1, 2].map((i) => ln(`M${128 + i * 16} 76Q${128 + i * 11} 60 ${128 + i * 5} 46`, 5, h)).join('') }) };
HAIR.silkpress = { name: 'Silk press', draw: (h, l) => ({ back: ol('<path d="M64 110C60 62 92 40 128 40C164 40 196 62 192 110C196 150 198 190 204 216H52C58 190 60 150 64 110Z"/>', h) + ln('M70 130C68 160 66 186 62 206', 5, l), front: ol('<path d="M71 150C62 94 88 46 128 46C168 46 194 94 185 150C182 118 172 96 128 74C84 96 74 118 71 150Z"/>', h) + ln('M92 84C102 66 116 56 130 54', 4, l) }) };
HAIR.bobwig = { name: 'Bob wig', draw: (h, l) => ({ back: ol('<path d="M60 108C56 60 92 38 128 38C164 38 200 60 196 108C198 130 198 146 192 158H64C58 146 58 130 60 108Z"/>', h), front: ol('<path d="M71 120C66 76 96 46 128 46C160 46 190 76 185 120C176 92 158 84 128 84C98 84 80 92 71 120Z"/>', h) + ln('M90 76C102 60 118 54 136 54', 4, l) }) };
HAIR.pixie = { name: 'Pixie cut', draw: (h, l) => ({ front: ol('<path d="M71 106C66 64 96 42 132 42C166 42 190 66 185 104C176 84 166 76 150 78C126 82 104 100 86 88C78 92 74 98 71 106Z"/>', h) + ln('M96 66Q122 50 152 58', 3.4, l) }) };
HAIR.knotless = { name: 'Knotless braids', draw: (h, l) => { const b = (d: string) => rope(d, 8, h) + `<path d="${d}" fill="none" stroke="${l}" stroke-width="8" stroke-dasharray="2 7"/>`; return { back: [-4, -3, -2, 2, 3, 4].map((i) => b(`M${128 + i * 15} 76C${128 + i * 18} 120 ${128 + i * 17} 170 ${128 + i * 16} 214`)).join(''), front: cap(h) + [-2, -1, 0, 1, 2].map((i) => ln(`M${128 + i * 18} 78Q${128 + i * 11} 60 ${128 + i * 4} 48`, 2.4, l)).join('') }; } };
HAIR.curlywig = { name: 'Curly wig', draw: (h, l) => ({ back: ol(ring(128, 96, 70, 74, 14, 20) + c(128, 96, 70), h), front: cap(h, ring(128, 68, 50, 16, 5, 13, 200, 340)) + [[66, 80], [190, 80], [58, 128], [198, 128], [66, 166], [190, 166]].map(([x, y]) => `<path d="M${x - 7} ${y}a7 7 0 1 1 7 7" fill="none" stroke="${l}" stroke-width="3" stroke-linecap="round"/>`).join('') }) };
HAIR.bodywaves = { name: 'Long waves', draw: (h, l) => ({ back: ol('<path d="M64 110C60 62 92 40 128 40C164 40 196 62 192 110C204 136 188 160 198 188C204 204 196 214 186 216H70C60 214 52 204 58 188C68 160 52 136 64 110Z"/>', h) + ln('M66 130C76 152 60 172 68 196M190 130C180 152 196 172 188 196', 4, l), front: ol('<path d="M71 140C62 90 90 46 128 46C166 46 194 90 185 140C180 112 168 92 128 72C88 92 76 112 71 140Z"/>', h) }) };
HAIR.braidpony = { name: 'Braided ponytail', draw: (h, l) => ({ back: rope('M128 46C176 12 214 54 204 112C200 142 196 158 188 174', 16, h) + `<path d="M128 46C176 12 214 54 204 112C200 142 196 158 188 174" fill="none" stroke="${l}" stroke-width="16" stroke-dasharray="2.5 10"/>`, front: cap(h) + [-3, -2, -1, 0, 1, 2, 3].map((i) => `<path d="M${128 + i * 15} 80Q${128 + i * 9} 62 ${128 + i * 3} 48" fill="none" stroke="${l}" stroke-width="3.6" stroke-dasharray="3 6" stroke-linecap="round"/>`).join('') }) };
HAIR.gelehigh = { name: 'Tall gele', draw: HAIR.gele.draw };
export const EYEWEAR: Record<string, () => string> = {
    round: () => `<g fill="none" stroke="${INK}" stroke-width="3.6"><circle cx="115" cy="106" r="15"/><circle cx="155" cy="106" r="13.5"/><path d="M130 104H141"/></g>`,
    shades: () => `<path d="M99 96H131V110C131 118 103 120 99 110ZM139 96H169V110C169 118 143 120 139 110ZM131 100H139" fill="#1c1619" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M105 102L116 100M145 102L156 100" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".6"/>`,
};
export const NECKS: Record<string, () => string> = {
    python: () => rope('M82 152C110 172 150 172 176 152', 11, '#c98a3a') + rope('M78 190C110 214 150 214 180 188', 11, '#c98a3a') + `<ellipse cx="184" cy="150" rx="11" ry="8" fill="#c98a3a" stroke="${INK}" stroke-width="3.2"/><circle cx="187" cy="148" r="1.8" fill="${INK}"/>` + ln('M100 168L108 170M124 174H132M150 170L158 166M100 208L108 210M124 214H132M150 210L158 206', 3),
    stone: () => `<path d="M128 164L146 190L128 208L110 190Z" fill="#8f97a8" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/><path d="M96 158Q128 176 160 158" fill="none" stroke="${INK}" stroke-width="3"/>`,
    apron: () => `<path d="M100 160H156L162 226H94Z" fill="#8a5a2c" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>` + ln('M104 176H152M100 198H156', 2.2, '#5e3a18'),
    cowries: () => Array.from({ length: 7 }, (_, i) => { const a = Math.PI * (0.16 + (i / 6) * 0.68); return cowrie(Math.round(128 + Math.cos(a) * 42), Math.round(152 + Math.sin(a) * 26), (i - 3) * -18); }).join(''),
    bronze: () => `<circle cx="128" cy="176" r="11" fill="#c98a3a" stroke="${INK}" stroke-width="3"/><path d="M92 158Q128 174 164 158" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="128" cy="176" r="4" fill="${INK}"/>`,
    redwhite: () => Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (0.1 + (i / 12) * 0.8); return `<circle cx="${Math.round(128 + Math.cos(a) * 42)}" cy="${Math.round(150 + Math.sin(a) * 26)}" r="4.6" fill="${i % 2 ? '#f4f4f6' : '#e23b30'}" stroke="${INK}" stroke-width="1.8"/>`; }).join(''),
    chain: () => Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.12 + (i / 8) * 0.76); return `<ellipse cx="${Math.round(128 + Math.cos(a) * 42)}" cy="${Math.round(152 + Math.sin(a) * 26)}" rx="6.4" ry="4" fill="#aeb6c6" stroke="${INK}" stroke-width="2"/>`; }).join(''),
    amber: () => Array.from({ length: 7 }, (_, i) => { const a = Math.PI * (0.16 + (i / 6) * 0.68); return `<circle cx="${Math.round(128 + Math.cos(a) * 42)}" cy="${Math.round(152 + Math.sin(a) * 28)}" r="7" fill="#e8982e" stroke="${INK}" stroke-width="2"/>`; }).join(''),
    none: () => '',
    coral: () => Array.from({ length: 5 }, (_, i) => `<rect x="${92 + i * 2}" y="${146 + i * 7}" width="${72 - i * 4}" height="7" rx="3.5" fill="#d9533f" stroke="${INK}" stroke-width="2.5"/>`).join(''),
    nokbeads: () => [0, 1, 2].map((r) => `<path d="M${94 + r * 2} 156Q128 ${172 + r * 11} ${162 - r * 2} 156" fill="none" stroke="#e8b84a" stroke-width="6" stroke-dasharray="1 8" stroke-linecap="round"/>`).join(''),
};
const stripe = (c2: string) => `<path d="M82 180H174M82 192H174" stroke="${c2}" stroke-width="6"/>`;
export const TOPS: Record<string, TopStyle> = {
    tee: { name: 'Tee', draw: () => '' },
    hoodie: { name: 'Hoodie', draw: (o) => ln('M100 160Q128 182 156 160') + ln('M118 176V194M138 176V194', 3, '#ffffff') },
    senator: { name: 'Senator', draw: (o) => ln(`M128 150V232`) + `<path d="M112 164V224M144 164V224" stroke="${o.lt}" stroke-width="4" stroke-dasharray="7 6" stroke-linecap="round"/>` },
    kaftan: { name: 'Kaftan', draw: () => `<path d="M100 152Q128 180 156 152M128 170V230" fill="none" stroke="#f0c04a" stroke-width="5" stroke-dasharray="1 8" stroke-linecap="round"/>` },
    agbada: { name: 'Agbada', draw: (o) => ol('<path d="M64 152C96 142 160 142 192 152L204 214C170 236 86 236 52 214Z"/>', o.c) + `<path d="M104 150Q128 178 152 150" fill="none" stroke="#f0c04a" stroke-width="5" stroke-dasharray="1 8" stroke-linecap="round"/>` + ln('M92 152L80 222M164 152L176 222', 3.5) },
    ankara: { name: 'Ankara', draw: () => '', fill: 'url(#ank)' },
    uli: { name: 'Uli lines', draw: () => ln('M92 178C104 164 116 192 128 178S152 164 164 178M94 200C106 188 116 212 128 200S150 188 162 200', 3, '#ffffff') + `<circle cx="128" cy="189" r="3" fill="#fff"/>` },
    strip: { name: 'Woven strips', draw: () => '', fill: 'url(#strip)' },
};
export const FACES: Record<string, [string, string]> = {
    smile: ['Smile', ln('M117 126Q128 136 139 126', 4.5)],
    grin: ['Big smile', ln('M112 124Q128 142 144 124', 4.5)],
    smirk: ['Smirk', ln('M118 130Q132 132 141 123', 4.5)],
    calm: ['Calm', ln('M119 129H137', 4.5)],
};
export const SKIN: Record<string, string> = { midnight: '#472a1d', espresso: '#5f3826', ebony: '#714430', umber: '#8a5236', walnut: '#9a5e3e', chestnut: '#ab6b45', sienna: '#bb7a50', caramel: '#c98b5f', honey: '#d69c6e', terracotta: '#c8693a', bronze: '#b98a3c', iron: '#6f7788', coralred: '#d9533f', blue: '#3f6df0', purple: '#7a4de8', pink: '#d9489a', teal: '#17a9c0', gold: '#f2a32e' };
const cowrie = (x: number, y: number, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="5" ry="7" fill="#fff4e2" stroke="${INK}" stroke-width="2"/><path d="M0 -4.6V4.6" stroke="${INK}" stroke-width="1.6"/></g>`;
HAIR.fulani = { name: 'Five braids', draw: (h, l) => { const b = (d: string) => rope(d, 9, h) + `<path d="${d}" fill="none" stroke="${l}" stroke-width="9" stroke-dasharray="2 8" opacity=".7"/>`; return { back: b('M78 100C60 124 60 150 72 162') + b('M178 100C196 124 196 150 184 162'), front: cap(h) + ol('<path d="M116 48C118 34 138 34 140 48L136 78H120Z"/>', h) + ln('M122 44L134 52M121 54L135 62M121 64L135 72', 2.6, l) + b('M90 84C76 102 74 130 84 150') + b('M166 84C180 102 182 130 172 150') + cowrie(84, 154) + cowrie(172, 154) + cowrie(128, 34, 0) + `<circle cx="72" cy="166" r="6" fill="#e8982e" stroke="${INK}" stroke-width="2.4"/><circle cx="184" cy="166" r="6" fill="#e8982e" stroke="${INK}" stroke-width="2.4"/>` }; } };
HAIR.cowrieband = { name: 'Cowrie band', draw: (h, l, o) => { return { front: cap(h) + ol(c(128, 38, 20), h) + ln('M112 38Q128 24 144 38', 2.8, l) + ol('<path d="M74 92C96 72 160 72 182 92L180 104C160 84 96 84 76 104Z"/>', '#ececf0') + [0, 1, 2, 3, 4, 5, 6].map((i) => cowrie(86 + i * 14, 91 - [4, 8, 10, 11, 10, 8, 4][i], -24 + i * 8)).join('') }; } };
const knot = (x: number, y: number, s: number, col: string) => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"><rect x="-10" y="-10" width="20" height="20" rx="3"/><rect x="-10" y="-10" width="20" height="20" rx="3" transform="rotate(45)"/><circle r="3.4"/></g>`;
TOPS.blazer = { name: 'Blazer', draw: (o) => `<path d="M110 156L128 228L146 156Z" fill="#f4f4f6" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M110 156L98 176L118 192M146 156L158 176L138 192" fill="${o.lt}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` };
TOPS.denim = { name: 'Denim jacket', draw: (o) => ln('M128 156V230', 3) + ln('M94 182H118M138 182H162', 2.6, '#e8e4dc') + `<path d="M108 156L128 172L148 156L156 172L128 186L100 172Z" fill="${o.lt}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` };
TOPS.jersey = { name: 'Jersey', draw: (o) => stripe('#f4f4f6') + `<text x="128" y="222" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="20" fill="#f4f4f6">9</text>` };
TOPS.bomber = { name: 'Bomber', draw: (o) => ln('M128 156V230', 3, '#e8c35a') + `<path d="M98 156Q128 176 158 156" fill="none" stroke="${o.lt}" stroke-width="8"/>` };
TOPS.tunic = { name: 'Agbada tunic', draw: () => `<path d="M104 158Q128 186 152 158M128 174V226" fill="none" stroke="#f0c04a" stroke-width="5" stroke-dasharray="1 8" stroke-linecap="round"/>` };
TOPS.isiagu = { name: 'Isi agu', draw: () => '', fill: 'url(#isiagu)' };
TOPS.ankaragown = { name: 'Ankara gown', draw: (o) => ln('M84 196Q128 208 172 196', 3), fill: 'url(#ank)' };
TOPS.bubairo = { name: 'Iro and buba', draw: (o) => ol('<path d="M77 196Q128 208 179 196L180 232H76Z"/>', o.lt) + ln('M78 212L178 204M92 232L176 196', 2.4, o.c) + `<path d="M98 156Q128 176 158 156" fill="none" stroke="#e8c35a" stroke-width="4" stroke-dasharray="1 7" stroke-linecap="round"/>` };
TOPS.babbanriga = { name: 'Babban riga', draw: () => knot(128, 182, 1.5, '#e8c35a') + `<path d="M100 158Q128 178 156 158" fill="none" stroke="#e8c35a" stroke-width="3"/><path d="M112 204H144M108 214H148" stroke="#e8c35a" stroke-width="2.6" stroke-dasharray="4 4"/>` };
TOPS.indigo = { name: 'Indigo cloth', draw: () => '', fill: 'url(#indigo)' };
TOPS.knotted = { name: 'Northern knot', draw: (o) => knot(128, 184, 1.25, '#e8c35a') + ln('M128 200V226', 2.4, '#e8c35a') };
const fold = (col: string) => ln('M92 172C96 182 94 194 98 202M166 166C160 176 164 188 158 198M110 214Q118 208 124 216', 2.6, col);
export const BGTONE: Record<string, string> = { '#d9b8ff': '#6a3fd9', '#a9d4ff': '#2b5fe6', '#ffc9a8': '#ec4a32', '#ffd978': '#f09a14', '#8fdde6': '#12a8bd', '#ffb3c1': '#d42e8a', '#b5b8ff': '#566784' };
// The thread rises out of the left hand, curves, and runs dead straight out of the middle of the left edge, where the
// reply line meets it. It is sampled into points so every style can follow the same curve.
const threadPoints = (cy: number) => {
    const points: [number, number][] = [];
    const [x0, y0, x1, y1, x2, y2, x3, y3] = [54, 170, 50, 146, 44, cy, 24, cy];
    for (let t = 0; t <= 1; t += 0.05) {
        const u = 1 - t;
        points.push([u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
    }
    for (let x = 18; x >= -70; x -= 6) points.push([x, cy]);
    return points;
};
const pathOf = (points: [number, number][]) => `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}`;
const offset = (points: [number, number][], by: (index: number) => number) =>
    points.map(([x, y], index): [number, number] => {
        const [ax, ay] = points[Math.max(0, index - 1)], [bx, by2] = points[Math.min(points.length - 1, index + 1)];
        const length = Math.hypot(bx - ax, by2 - ay) || 1;
        return [x - ((by2 - ay) / length) * by(index), y + ((bx - ax) / length) * by(index)];
    });
export const threadLine = (style: string | undefined, col: string, w = 7, cy = 108) => {
    const points = threadPoints(cy), d = pathOf(points), k = w / 7;
    const stroke = (path: string, c: string, width: number, extra = '') => `<path d="${path}" fill="none" stroke="${c}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
    if (style === 'fire') {
        const flames = points.filter((_, index) => index % 3 === 1).map(([x, y], index) => `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(k * 0.9).toFixed(2)})" d="M0 4C-6 1 -4 -6 0 -13C4 -6 6 1 0 4Z" fill="${index % 2 ? '#ffd23f' : '#ff8a1f'}"/>`);
        return stroke(d, '#e8381f', w) + flames.join('');
    }
    if (style === 'lightning') {
        const zig = pathOf(offset(points.filter((_, index) => index % 2 === 0), (index) => (index % 2 ? 1 : -1) * 2.2 * k));
        return stroke(zig, '#ffd23f', w * 1.9, ' opacity=".28"') + stroke(zig, '#ffd23f', w) + stroke(zig, '#ffffff', w * 0.32);
    }
    if (style === 'river') {
        const wave = pathOf(offset(points, (index) => Math.sin(index * 0.8) * 1.8 * k));
        return stroke(wave, '#2fa8e8', w) + stroke(wave, '#d6f2ff', w * 0.3, ` stroke-dasharray="${5 * k} ${6 * k}"`);
    }
    if (style === 'iron') return stroke(d, '#4d5666', w * 1.25, ` stroke-dasharray="${7 * k} ${3.5 * k}"`) + stroke(d, '#c8d0dc', w * 0.6, ` stroke-dasharray="${7 * k} ${3.5 * k}"`);
    if (style === 'beads') return points.filter((_, index) => index % 2 === 0).map(([x, y], index) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(w * 0.62).toFixed(1)}" fill="${index % 2 ? '#f4f4f6' : '#e23b30'}"/>`).join('');
    return stroke(d, col, w) + stroke(d, '#ffffff', w * 0.2, ` stroke-dasharray="${8 * k} ${12 * k}" opacity=".5"`);
};
// The crop: left, top and size on the 256 grid. Short hair zooms in so the character reads at small sizes; tall styles zoom out
export type Crop = [number, number, number];
const svgOpen = ([x, y, s]: Crop) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${s} ${s}" width="272" height="272">`;
const backdrop = ([x, y, s]: Crop, fill: string) => `<rect x="${x - 2}" y="${y - 2}" width="${s + 4}" height="${s + 4}" fill="${fill}"/>`;
// Starter: one colour family only, no clothes or hair, like an unfilled silhouette
export const drawStarter = (g: { tone: string; crop: Crop; thread?: string; threadWidth?: number }) => {
    uid = 0;
    const a = g.tone, soft = mix(a, '#ffffff', 0.42), line = mix(a, '#120a1c', 0.68), side = 9;
    const ink = (s: string, x: number, y: number) => `<g transform="translate(${x} ${y})" fill="${line}" stroke="${line}" stroke-width="7" stroke-linejoin="round">${s}</g>`;
    const toned = (s: string) => { const id = `t${++uid}`; return ink(s, 1.5, 2.5) + ink(s, 0, 0) + `<clipPath id="${id}">${s}</clipPath><g fill="${mix(a, '#120a1c', 0.3)}">${s}</g><g clip-path="url(#${id})"><g fill="${a}" transform="translate(-7 -8)">${s}</g><g fill="${mix(a, '#ffffff', 0.18)}" transform="translate(-16 -18)" opacity=".7">${s}</g></g>`; };
    return `${svgOpen(g.crop)}${backdrop(g.crop, soft)}<ellipse cx="136" cy="330" rx="210" ry="110" fill="${mix(a, '#ffffff', 0.2)}"/><ellipse cx="128" cy="258" rx="58" ry="6" fill="${line}" opacity=".22"/><g transform="rotate(-2.5 128 240)">${toned('<ellipse cx="104" cy="244" rx="17" ry="8.5"/><ellipse cx="152" cy="244" rx="17" ry="8.5"/>')}${toned(`<path d="${BODY}"/>`)}<ellipse cx="${106 + side}" cy="106" rx="7" ry="9" fill="${line}"/><ellipse cx="${146 + side}" cy="106" rx="6" ry="9" fill="${line}"/><path d="M${113 + side} 128Q${124 + side} 139 ${135 + side} 128" fill="none" stroke="${line}" stroke-width="5" stroke-linecap="round"/>${toned('<circle cx="199" cy="178" r="10.5"/>')}</g>${g.thread ? threadLine(undefined, g.thread, g.threadWidth, g.crop[1] + g.crop[2] / 2) : ''}<g transform="rotate(-2.5 128 240)">${toned('<circle cx="57" cy="180" r="10.5"/>')}</g></svg>`;
};
export const drawAvatar = (g: Drawing) => {
    uid = 0;
    const skin = SKIN[g.skin], h = g.hc || '#2b2126', l = mix(h, '#ffffff', 0.5), cl = g.cloth, o = { c: cl, lt: mix(cl, '#ffffff', 0.35) };
    const thread = g.thread ?? '#f2b134', top = TOPS[g.top], hair = HAIR[g.hair].draw(h, l, o, thread);
    const tone = BGTONE[g.bg] || g.bg, dk = mix(tone, '#ffffff', 0.42), hill = mix(tone, '#ffffff', 0.2), side = 9;
    const glow = g.glow;
    const wrap = (x: number, sx: number, s: string) => `<g transform="translate(${x} 106) scale(${sx} 1)">${s}</g>`;
    const eye = (x: number, sx: number) => {
        const st = g.eyestyle;
        if (st === 'blank') return wrap(x, sx, `<ellipse rx="9.5" ry="11" fill="${glow}" opacity=".3"/><ellipse rx="6.6" ry="8.2" fill="#1c0f0c"/><ellipse rx="4.8" ry="6.4" fill="${glow}"/>`);
        if (st === 'nok') return wrap(x, sx, `<path d="M-10 -5Q0 -9 10 -5L0 9Z" fill="#1c0f0c" stroke="#1c0f0c" stroke-width="2.5" stroke-linejoin="round"/>`);
        if (st === 'almond') return wrap(x, sx, `<path d="M-10 2C-5 -8 6 -8 10 -1C5 7 -5 8 -10 2Z" fill="#1c0f0c"/><circle cx="2.6" cy="-2.4" r="2.2" fill="#fff"/>`);
        if (st === 'sleepy') return wrap(x, sx, `<ellipse rx="7" ry="8" fill="#1c0f0c"/><circle cx="2.4" cy="1" r="2.2" fill="#fff"/><path d="M-10 -8H10V-1H-10Z" fill="${skin}"/><path d="M-10 -1H10" stroke="#1c0f0c" stroke-width="3.2" stroke-linecap="round"/>`);
        if (st === 'cowrie') return wrap(x, sx, `<ellipse rx="7.6" ry="10" fill="#fff4e2" stroke="#1c0f0c" stroke-width="2.6"/><path d="M0 -6V6" stroke="#1c0f0c" stroke-width="2.4"/>`);
        if (st === 'star') return wrap(x, sx, `<ellipse rx="7" ry="9" fill="#1c0f0c"/><path d="M0 -7L1.6 -1.6L7 0L1.6 1.6L0 7L-1.6 1.6L-7 0L-1.6 -1.6Z" fill="#ffd35a"/>`);
        if (st === 'ring') return wrap(x, sx, `<ellipse rx="7.6" ry="9.4" fill="#c98a3a" stroke="#1c0f0c" stroke-width="2.6"/><ellipse rx="3.4" ry="4.6" fill="#1c0f0c"/>`);
        return wrap(x, sx, `<ellipse rx="7" ry="9" fill="#1c0f0c"/><ellipse cy="4.4" rx="4.2" ry="2.8" fill="#70402a"/><circle cx="2.4" cy="-3.8" r="2.6" fill="#fff"/><circle cx="-2.6" cy="3" r="1.1" fill="#fff" opacity=".8"/>`);
    };
    const face = g.eyes === 'wink' ? eye(106 + side, 1) + `<g transform="translate(${side} 0)">${ln('M136 109Q144 98 152 109', 5)}</g>` : g.eyes === 'happy' ? `<g transform="translate(${side} 0)">${ln('M96 109Q106 97 116 109M136 109Q144 98 152 109', 5)}</g>` : eye(106 + side, 1) + eye(146 + side, 0.86);
    const brows = g.eyes === 'happy' ? '' : ln(`M${99 + side} 91Q106 87 114 ${90}M${140 + side} 90Q147 87 153 ${91}`, 3.6);
    const mouth = `<g transform="translate(${side - 2} 2)">${FACES[g.mouth][1].replace(/stroke-width="[\d.]+"/, 'stroke-width="3.6"').replace(g.beard ? INK : '\u0000', mix(skin, '#ffffff', 0.45))}</g>`;
    const blush = `<ellipse cx="${92 + side}" cy="124" rx="11" ry="6" fill="#d9533f" opacity=".16"/><ellipse cx="${156 + side}" cy="124" rx="8" ry="6" fill="#d9533f" opacity=".16"/>`;
    const armR = ol(c(199, 178, 10.5), skin);
    const armL = ol(c(57, 180, 10.5), skin);
    const foot = (x: number, r: number) => `<g transform="rotate(${r} ${x} 250)">${ol(`<ellipse cx="${x}" cy="244" rx="17" ry="8.5"/>`, top.fill ? '#f4f4f6' : '#f4f4f6')}<path d="M${x - 16} 246H${x + 16}" stroke="${INK}" stroke-width="2.4"/></g>`;
    return `${svgOpen(g.crop)}<defs><clipPath id="b"><path d="${BODY}"/></clipPath><pattern id="ank" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="${cl}"/><circle cx="15" cy="15" r="9" fill="#f0c04a"/><circle cx="15" cy="15" r="4.4" fill="${INK}"/></pattern><pattern id="isiagu" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="${cl}"/><circle cx="22" cy="22" r="13" fill="none" stroke="#f0c04a" stroke-width="3"/><path d="M14 18L22 13L30 18L28 28H16Z" fill="#f0c04a"/><circle cx="19" cy="21" r="1.4" fill="${cl}"/><circle cx="25" cy="21" r="1.4" fill="${cl}"/></pattern><pattern id="strip" width="28" height="20" patternUnits="userSpaceOnUse"><rect width="28" height="20" fill="${cl}"/><rect width="10" height="20" fill="#f4f4f6"/><rect x="10" y="0" width="4" height="20" fill="#e8b84a"/><rect x="14" y="8" width="14" height="4" fill="${INK}"/></pattern><pattern id="indigo" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#1e2a6b"/><rect width="11" height="11" fill="#2b3f96"/><rect x="11" y="11" width="11" height="11" fill="#2b3f96"/><path d="M0 0H22M0 11H22M0 0V22M11 0V22" stroke="#7f8fd8" stroke-width="1"/></pattern></defs>${backdrop(g.crop, dk)}<ellipse cx="136" cy="330" rx="210" ry="110" fill="${hill}"/><ellipse cx="128" cy="262" rx="62" ry="6" fill="#000" opacity=".2"/><g transform="rotate(-2.5 128 240)">${hair.back || ''}${foot(104, -4)}${foot(152, 4)}${ol(`<path d="${BODY}"/>`, skin)}<g clip-path="url(#b)"><path d="M60 158C90 150 166 150 200 158V260H60Z" fill="${top.fill || cl}"/>${top.fill ? '' : `<path d="M150 150C170 180 170 214 152 240H200V150Z" fill="#1a0f24" opacity=".2"/>`}<path d="M60 158C90 150 166 150 200 158" fill="none" stroke="${INK}" stroke-width="3.4"/>${top.fill ? '' : fold(mix(cl, '#1a0f24', 0.45))}<path d="M84 110C84 80 96 66 112 60" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".22"/></g><path d="${BODY}" fill="none" stroke="${INK}" stroke-width="${OUT * 1.5}"/>${top.draw(o)}${blush}${g.beard ? `<g clip-path="url(#b)"><path d="M74 112C84 128 96 122 112 118C124 116 132 116 152 118C166 122 174 128 184 112V156H74Z" fill="${h}"/></g>` : ''}${NECKS[g.neck || 'none']()}${brows}${face}${mouth}${hair.front || ''}${g.eyewear ? EYEWEAR[g.eyewear]() : ''}${armR}</g>${g.thread ? threadLine(g.threadStyle, thread, g.threadWidth, g.crop[1] + g.crop[2] / 2) : ''}<g transform="rotate(-2.5 128 240)">${armL}</g></svg>`;
};
