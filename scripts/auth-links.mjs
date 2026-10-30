// Emailed links must open for people who are signed in: someone who just signed up taps "confirm" in the same
// browser. The sign-in pages themselves still send signed-in people home (proxy.ts).
//
//   node scripts/auth-links.mjs http://localhost:3000
const base = process.argv[2] ?? 'http://localhost:3000';
const signedIn = 'access_token=check; refresh_token=check';

const cases = [
    { path: '/auth/verify-email?token=check', home: false },
    { path: '/auth/confirm-email?token=check', home: false },
    { path: '/auth/reset-password?token=check', home: false },
    { path: '/auth/login', home: true },
    { path: '/auth/signup', home: true },
    { path: '/auth/forgot-password', home: true },
];

let failed = 0;
for (const { path, home } of cases) {
    const response = await fetch(base + path, { headers: { cookie: signedIn }, redirect: 'manual' });
    const location = response.headers.get('location');
    const wentHome = response.status >= 300 && response.status < 400 && location !== null && new URL(location, base).pathname === '/';
    const ok = home ? wentHome : response.status === 200;
    if (!ok) failed += 1;
    console.log(`${ok ? '✓' : '✗'} signed in, ${path} → ${response.status}${location ? ` ${location}` : ''} (expected ${home ? 'redirect home' : '200'})`);
}
if (failed) {
    console.error(`${failed} check(s) failed`);
    process.exit(1);
}
