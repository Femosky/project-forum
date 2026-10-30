import { NextResponse, NextRequest } from 'next/server';
import {
    ACCESS_TOKEN_COOKIE_NAME,
    API_BASE,
    DATA_SAVER_COOKIE_NAME,
    REFRESH_TOKEN_COOKIE_NAME,
    THEME_COOKIE_NAME,
} from './lib/constants';
import { CRAWLER_UA } from './lib/bots';

// Pulls name=value off a Set-Cookie header (attributes are ignored)
function cookieValue(setCookie: string, name: string): string | undefined {
    const [pair] = setCookie.split(';');
    const index = pair.indexOf('=');
    return pair.slice(0, index).trim() === name ? decodeURIComponent(pair.slice(index + 1)) : undefined;
}

// The access cookie lives 15 minutes; when it's gone but the session isn't, rotate it here so the page renders
// signed in (with the viewer's votes and saves) instead of as a guest
async function refreshSession(request: NextRequest): Promise<NextResponse> {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value ?? '';
    let setCookies: string[] = [];
    try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { Cookie: `${REFRESH_TOKEN_COOKIE_NAME}=${encodeURIComponent(refreshToken)}` },
        });
        setCookies = response.headers.getSetCookie();
    } catch {
        // API unreachable: render as a guest; the browser retries on its next request
        return NextResponse.next();
    }

    // Let this render see the new cookies...
    for (const header of setCookies) {
        for (const name of [ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME]) {
            const value = cookieValue(header, name);
            if (value === undefined) continue;
            if (value) request.cookies.set(name, value);
            else request.cookies.delete(name);
        }
    }
    const next = NextResponse.next({ request: { headers: request.headers } });
    // ...and hand them to the browser (a failed refresh clears them)
    for (const header of setCookies) next.headers.append('Set-Cookie', header);
    return next;
}

type PageState = { state: 'live'; path: string } | { state: 'gone' } | { state: 'missing' };

const PAGE_PATTERNS: [RegExp, 'post' | 'community' | 'user'][] = [
    [/^\/c\/[^/]+\/([^/]+)(?:\/.*)?$/, 'post'],
    [/^\/c\/([^/]+)\/?$/, 'community'],
    [/^\/u\/([^/]+)\/?$/, 'user'],
];

function plainResponse(status: number, message: string) {
    return new NextResponse(`<!doctype html><meta name="robots" content="noindex"><title>${message}</title><h1>${message}</h1>`, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}

// Pages stream behind loading.tsx skeletons, so by the time a page finds its post is gone or its URL is stale,
// the 200 has been sent and people get an in-page 404 or redirect. That's fine for people; crawlers get the real
// codes here instead: 301 to the canonical URL, 404 for unknown pages and 410 for deleted or removed ones.
async function crawlerStatus(request: NextRequest): Promise<NextResponse | null> {
    const { pathname, search } = request.nextUrl;
    const match = PAGE_PATTERNS.map(([pattern, type]) => ({ type, id: pattern.exec(pathname)?.[1] })).find((item) => item.id);
    if (!match?.id || match.id === 'submit' || match.id === 'mod') return null;

    let page: PageState;
    try {
        const query = new URLSearchParams({ type: match.type, id: decodeURIComponent(match.id) });
        const response = await fetch(`${API_BASE}/seo/status?${query}`, { signal: AbortSignal.timeout(3000) });
        if (!response.ok) return null;
        page = (await response.json()) as PageState;
    } catch {
        return null;
    }

    if (page.state === 'missing') return plainResponse(404, 'Page not found');
    if (page.state === 'gone') return plainResponse(410, 'This page was removed');
    // Wrong slug, wrong community or wrong case: the query (?comment, ?sort...) carries over
    if (decodeURIComponent(pathname) !== page.path) return NextResponse.redirect(new URL(`${page.path}${search}`, request.url), 301);
    return null;
}

// Guest pages at the edge. Signed-out visits to the home, trending, community and post pages are rewritten to a
// copy of the same page under /guest (app/guest), which renders without cookies or headers and is kept for 60
// seconds (Next's ISR; on Vercel the CDN serves it, stale for up to 5 more minutes while it re-renders). Every guest
// gets the same HTML and the API, and with it the database, is asked about once a minute instead of on every visit.
//
// Only plain visits qualify: no sign-in cookies (signed-in pages hold votes, saves and memberships and are never
// shared), no theme or data-saver choice and no Save-Data header (the layout renders those), and no query string
// (sort, cursor and ?comment= change the page; the guest copy ignores them). Everyone else gets the page rendered
// for them, as before. Client navigations (RSC payloads) aren't rewritten either.
const GUEST_PAGES = [/^\/$/, /^\/trending\/?$/, /^\/c\/[^/]+\/?$/, /^\/c\/[^/]+\/[^/]+(?:\/[^/]*)?\/?$/];
const NOT_GUEST_PAGES = /^\/c\/[^/]+\/(?:mod|submit)(?:\/|$)/;

function isPlainGuestVisit(request: NextRequest): boolean {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false;
    const { cookies, headers, nextUrl } = request;
    if (cookies.has(REFRESH_TOKEN_COOKIE_NAME) || cookies.has(ACCESS_TOKEN_COOKIE_NAME)) return false;
    if (cookies.has(THEME_COOKIE_NAME) || cookies.has(DATA_SAVER_COOKIE_NAME) || headers.get('save-data')?.toLowerCase() === 'on') return false;
    if (nextUrl.search !== '' || headers.has('rsc') || headers.has('next-router-prefetch')) return false;
    return !NOT_GUEST_PAGES.test(nextUrl.pathname) && GUEST_PAGES.some((pattern) => pattern.test(nextUrl.pathname));
}

function serveGuestCopy(request: NextRequest) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname === '/' ? '/guest' : `/guest${url.pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set('X-Guest-Cache', 'shared');
    return response;
}

const SIGNED_OUT_ONLY = new Set(['/auth/login', '/auth/signup', '/auth/forgot-password']);

export async function proxy(request: NextRequest) {
    if (CRAWLER_UA.test(request.headers.get('user-agent') ?? '')) {
        const answer = await crawlerStatus(request);
        if (answer) return answer;
    }

    // The guest copies are only reached through the rewrite below; their own addresses lead back to the real page
    const { pathname } = request.nextUrl;
    if (pathname === '/guest' || pathname.startsWith('/guest/')) {
        return NextResponse.redirect(new URL((pathname.slice('/guest'.length) || '/') + request.nextUrl.search, request.url), 308);
    }

    const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE_NAME);

    // Signed-in people have no use for the sign-in pages, but the pages emailed links open (confirm email, reset
    // password) must still load: someone who just signed up is signed in when they tap "confirm"
    if (hasRefreshToken && SIGNED_OUT_ONLY.has(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (hasRefreshToken && !request.cookies.has(ACCESS_TOKEN_COOKIE_NAME)) {
        return refreshSession(request);
    }

    if (isPlainGuestVisit(request)) return serveGuestCopy(request);

    return NextResponse.next();
}

export const config = {
    // Pages only: skip Next's own assets and files with an extension
    matcher: ['/((?!_next/static|_next/image|_a/|_e$|favicon.ico|.*\\.[a-z0-9]+$).*)'],
};
