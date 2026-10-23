import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE_NAME, API_BASE } from '@/lib/constants';

export type ServerResult<T> = { data: T; status: number } | { data: null; status: number };

// Reads from the API while rendering on the server. The viewer's access token is forwarded so pages render
// with their votes, saves and memberships; the proxy has already refreshed it if it had expired.
export async function serverApi<T>(path: string): Promise<ServerResult<T>> {
    const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value;

    try {
        const response = await fetch(`${API_BASE}${path}`, {
            cache: 'no-store',
            headers: accessToken ? { Cookie: `${ACCESS_TOKEN_COOKIE_NAME}=${accessToken}` } : undefined,
        });
        if (!response.ok) return { data: null, status: response.status };
        return { data: (await response.json()) as T, status: response.status };
    } catch {
        return { data: null, status: 0 };
    }
}
