import { NextResponse, NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE_NAME, API_BASE, REFRESH_TOKEN_COOKIE_NAME } from './lib/constants';

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

export async function proxy(request: NextRequest) {
    const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE_NAME);

    if (hasRefreshToken && request.nextUrl.pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (hasRefreshToken && !request.cookies.has(ACCESS_TOKEN_COOKIE_NAME)) {
        return refreshSession(request);
    }

    return NextResponse.next();
}

export const config = {
    // Pages only: skip Next's own assets and files with an extension
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[a-z0-9]+$).*)'],
};
