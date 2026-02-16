import { NextResponse, NextRequest } from 'next/server';
import { REFRESH_TOKEN_COOKIE_NAME } from './lib/constants';

// This function can be marked `async` if using `await` inside
export function proxy(request: NextRequest) {
    const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE_NAME);

    if (hasRefreshToken) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/auth/login/:path*',
};
