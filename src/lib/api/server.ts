import { cache } from 'react';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE_NAME, API_BASE } from '@/lib/constants';

export type ServerResult<T> = { data: T; status: number } | { data: null; status: number };

// One fetch per path per request: generateMetadata and the page ask for the same post, and React's cache()
// makes the second ask free
const cachedServerFetch = cache(async (path: string): Promise<ServerResult<unknown>> => {
    const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value;

    try {
        const response = await fetch(`${API_BASE}${path}`, {
            cache: 'no-store',
            headers: accessToken ? { Cookie: `${ACCESS_TOKEN_COOKIE_NAME}=${accessToken}` } : undefined,
        });
        if (!response.ok) return { data: null, status: response.status };
        return { data: await response.json(), status: response.status };
    } catch {
        return { data: null, status: 0 };
    }
});

// Reads from the API while rendering on the server. The viewer's access token is forwarded so pages render
// with their votes, saves and memberships; the proxy has already refreshed it if it had expired.
export async function serverApi<T>(path: string): Promise<ServerResult<T>> {
    return cachedServerFetch(path) as Promise<ServerResult<T>>;
}

// Reads public data as a guest and keeps it in Next's data cache for `revalidate` seconds. For crawler-facing
// files (sitemaps, llms.txt, share images) that shouldn't hit the API on every request.
export async function publicApi<T>(path: string, revalidate = 3600): Promise<ServerResult<T>> {
    try {
        const response = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
        if (!response.ok) return { data: null, status: response.status };
        return { data: (await response.json()) as T, status: response.status };
    } catch {
        return { data: null, status: 0 };
    }
}
