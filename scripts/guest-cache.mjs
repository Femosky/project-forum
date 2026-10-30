// Guest pages at the edge (proxy.ts, app/guest): plain signed-out visits get the shared, cacheable copy; anyone
// signed in, with a theme or data-saver choice, or with a query string gets their own page, never a shared one.
// Nothing shared may set a cookie. Runs against `next start` in CI.
//
//   node scripts/guest-cache.mjs http://localhost:3000
const base = process.argv[2] ?? 'http://localhost:3000';
const browser = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const home = '/';
const community = '/c/budget';

const cases = [
    { name: 'guest, home', path: home, shared: true },
    { name: 'guest, trending', path: '/trending', shared: true },
    { name: 'guest, community', path: community, shared: true },
    { name: 'signed in', path: home, cookie: 'access_token=check; refresh_token=check', shared: false },
    { name: 'signed in, access token expired', path: community, cookie: 'refresh_token=check', shared: false },
    { name: 'guest with a theme', path: home, cookie: 'theme=dark', shared: false },
    { name: 'guest with data saver', path: home, headers: { 'save-data': 'on' }, shared: false },
    { name: 'guest, sorted', path: `${community}?sort=new`, shared: false },
    { name: 'guest, moderation page', path: `${community}/mod`, shared: false },
];

let failed = 0;
const check = (ok, line) => {
    if (!ok) failed += 1;
    console.log(`${ok ? '✓' : '✗'} ${line}`);
};

for (const { name, path, cookie, headers, shared } of cases) {
    const response = await fetch(base + path, {
        headers: { 'user-agent': browser, ...(cookie ? { cookie } : {}), ...headers },
        redirect: 'manual',
    });
    const cacheControl = response.headers.get('cache-control') ?? '';
    const isShared = /s-maxage=\d+/.test(cacheControl) && !/private|no-store/.test(cacheControl);
    check(isShared === shared, `${name} (${path}): ${shared ? 'shared' : 'own page'} [${cacheControl}]`);
    if (shared) check(!response.headers.has('set-cookie'), `${name}: no Set-Cookie on a shared page`);
}

const direct = await fetch(`${base}/guest/shared/c/budget`, { redirect: 'manual' });
check(direct.status === 308 && direct.headers.get('location')?.endsWith('/c/budget'), `/guest/shared/c/budget leads back to /c/budget (${direct.status})`);

if (failed) {
    console.error(`${failed} check(s) failed`);
    process.exit(1);
}
