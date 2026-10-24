// Performance budget check (roadmap Phase 3/4): many readers are on mid-range Android phones paying per megabyte,
// so page weight is a product feature. Run against a production build (`next start`):
//
//   node scripts/perf-budget.mjs [baseUrl] [postPath]
//
// Checks, for each page: HTML size gzipped, first-load JavaScript gzipped (every <script src> on the page), and
// that the page can be read with JavaScript off (the post title and comments are in the server HTML, and not
// inside a streamed boundary that only JavaScript reveals).
// Exits non-zero when a budget is exceeded. LCP and CLS are checked separately by Lighthouse CI (lighthouserc.json).
import { gzipSync } from 'node:zlib';

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const POST_PATH = process.argv[3] ?? '/c/budget/bdgt0001/what-does-a-month-of-groceries-cost-you';

const KB = 1024;
// The roadmap's JS target is 120 KB, but Next 16 and React 19 alone ship about 122 KB gzipped before any app code,
// so JS is a ratchet at today's size: it fails on growth. Lower it whenever client code shrinks. Raised from 205 KB
// to 210 KB in Oct 2026 for the Next 16.4 security upgrade, which added about 4 KB of framework code.
const BUDGET = { html: 60 * KB, js: 210 * KB };

// A normal phone browser, not a crawler: crawlers get a blocking render, people get the streamed page
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36' };

const PAGES = [
    { name: 'Post', path: POST_PATH, mustContain: ['What does a month of groceries cost you?', 'Budget comment 1:'] },
    { name: 'Home', path: '/', mustContain: ['What does a month of groceries cost you?'] },
    { name: 'Community', path: '/c/budget', mustContain: ['c/budget'] },
    { name: 'Profile', path: '/u/budget_user', mustContain: ['budget_user'] },
];

const gz = (text) => gzipSync(Buffer.from(text), { level: 6 }).length;
const kb = (bytes) => `${(bytes / KB).toFixed(1)} KB`;

const scriptCache = new Map();
async function scriptSize(src) {
    const url = new URL(src, BASE).toString();
    if (!scriptCache.has(url)) {
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) throw new Error(`${url} answered ${response.status}`);
        scriptCache.set(url, gz(await response.text()));
    }
    return scriptCache.get(url);
}

let failed = false;
const rows = [];

for (const page of PAGES) {
    const response = await fetch(`${BASE}${page.path}`, { headers: HEADERS, redirect: 'manual' });
    const html = await response.text();
    if (response.status !== 200) {
        console.error(`✗ ${page.name} ${page.path} answered ${response.status}`);
        failed = true;
        continue;
    }

    // noModule scripts are polyfills only old browsers download
    const tags = [...html.matchAll(/<script\b[^>]*>/g)].map((match) => match[0]).filter((tag) => !/\bnoModule\b/i.test(tag));
    const srcs = [...new Set(tags.flatMap((tag) => /\bsrc="([^"]+)"/.exec(tag)?.[1] ?? []))];
    const sizes = await Promise.all(srcs.map(scriptSize));
    const js = sizes.reduce((sum, size) => sum + size, 0);
    const htmlSize = gz(html);
    const missing = page.mustContain.filter((text) => !html.includes(text));
    // Streamed Suspense content (a loading.tsx, say) arrives in <div hidden> and only JavaScript reveals it
    const hiddenUntilJs = /<div hidden id="S:\d+">/.test(html);

    const problems = [
        htmlSize > BUDGET.html && `HTML ${kb(htmlSize)} > ${kb(BUDGET.html)}`,
        js > BUDGET.js && `JS ${kb(js)} > ${kb(BUDGET.js)}`,
        missing.length > 0 && `not readable without JS (missing ${missing.map((text) => JSON.stringify(text)).join(', ')})`,
        hiddenUntilJs && 'not readable without JS (content streamed into a hidden boundary; is there a loading.tsx?)',
    ].filter(Boolean);
    if (problems.length) failed = true;
    rows.push({ page: page.name, html: kb(htmlSize), js: `${kb(js)} (${srcs.length} files)`, result: problems.length ? `✗ ${problems.join('; ')}` : '✓' });
}

console.table(rows);
console.log(`Budget: HTML ≤ ${kb(BUDGET.html)} gzipped, first-load JS ≤ ${kb(BUDGET.js)} gzipped, readable without JavaScript.`);
if (failed) {
    console.error('Performance budget exceeded.');
    process.exit(1);
}
