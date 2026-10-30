import { NextResponse, NextRequest } from 'next/server';
import {
    ACCESS_TOKEN_COOKIE_NAME,
    API_BASE,
    DATA_SAVER_COOKIE_NAME,
    REFRESH_TOKEN_COOKIE_NAME,
    THEME_COOKIE_NAME,
    THEMES,
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

// Guest pages at the edge. Logged-out visitors to the home, trending, community and post pages get HTML that is the
// same for every guest, so Vercel's CDN may keep it for 60 seconds (and serve it stale for 5 more minutes while it
// re-renders). Signed-in requests are never stored: they keep Next's private, no-store response.
//
// The guest page still varies by the theme cookie and data saver (the layout renders both), so the request is
// rewritten to carry that as a ?__guest= key, giving each combination its own cache entry and keeping guest
// entries apart from the URLs signed-in people request. Even if a cache served a guest copy to someone signed in,
// it would only show them signed out: guest HTML holds nothing personal, and nothing personal is ever stored.
// Votes, saves and memberships only exist for signed-in people, whose pages render fresh with them.
const GUEST_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';
const GUEST_PAGES = [/^\/$/, /^\/trending\/?$/, /^\/c\/[^/]+\/?$/, /^\/c\/[^/]+\/[^/]+(?:\/[^/]*)?\/?$/];
const NOT_GUEST_PAGES = /^\/c\/[^/]+\/(?:mod|submit)(?:\/|$)/;

function guestVariant(request: NextRequest): string | null {
    if (request.method !== 'GET' && request.method !== 'HEAD') return null;
    if (request.cookies.has(REFRESH_TOKEN_COOKIE_NAME) || request.cookies.has(ACCESS_TOKEN_COOKIE_NAME)) return null;
    // Client navigations fetch RSC payloads keyed by router state (?_rsc=; Next hides the RSC header from the
    // proxy); only full documents are shared
    if (request.nextUrl.searchParams.has('_rsc') || request.headers.has('rsc') || request.headers.has('next-router-prefetch')) return null;
    const { pathname } = request.nextUrl;
    if (NOT_GUEST_PAGES.test(pathname) || !GUEST_PAGES.some((pattern) => pattern.test(pathname))) return null;

    const theme = request.cookies.get(THEME_COOKIE_NAME)?.value;
    const saver = request.cookies.get(DATA_SAVER_COOKIE_NAME)?.value;
    const dataSaver = saver === 'on' || (saver !== 'off' && request.headers.get('save-data')?.toLowerCase() === 'on');
    return `${(THEMES as readonly string[]).includes(theme ?? '') ? theme : 'auto'}.${dataSaver ? 'lite' : 'full'}`;
}

function cacheForGuests(request: NextRequest, variant: string) {
    const url = request.nextUrl.clone();
    url.searchParams.set('__guest', variant);
    const response = NextResponse.rewrite(url);
    // Vercel's CDN reads Vercel-CDN-Cache-Control first and never passes it on; browsers get Cache-Control and
    // always check back, so a reader who signs in next sees their own page straight away
    response.headers.set('Vercel-CDN-Cache-Control', GUEST_CACHE_CONTROL);
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    response.headers.set('X-Guest-Cache', variant);
    return response;
}

export async function proxy(request: NextRequest) {
    if (CRAWLER_UA.test(request.headers.get('user-agent') ?? '')) {
        const answer = await crawlerStatus(request);
        if (answer) return answer;
    }

    const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE_NAME);

    if (hasRefreshToken && request.nextUrl.pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (hasRefreshToken && !request.cookies.has(ACCESS_TOKEN_COOKIE_NAME)) {
        return refreshSession(request);
    }

    const variant = guestVariant(request);
    if (variant) return cacheForGuests(request, variant);

    return NextResponse.next();
}

export const config = {
    // Pages only: skip Next's own assets and files with an extension
    matcher: ['/((?!_next/static|_next/image|_a/|_e$|favicon.ico|.*\\.[a-z0-9]+$).*)'],
};
