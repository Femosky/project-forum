'use client';

import { API_BASE } from '@/lib/constants';
import { useAuthStateStore } from '@/lib/stateStore';
import { ApiError, toApiError } from './errors';

type RequestOptions = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown };

// One refresh at a time, however many requests hit a 401 together
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
    refreshing ??= fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
        .then((response) => response.ok)
        .catch(() => false)
        .finally(() => {
            refreshing = null;
        });
    return refreshing;
}

function send(path: string, { method = 'GET', body }: RequestOptions) {
    return fetch(`${API_BASE}${path}`, {
        method,
        credentials: 'include',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

// Calls the API from the browser. An expired access token is refreshed once and the request retried; if the
// session is gone the app switches to signed-out. Throws ApiError with the API's code and safe message.
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
    let response: Response;
    try {
        response = await send(path, options);
        if (response.status === 401 && !path.startsWith('/auth/')) {
            if (await refreshSession()) {
                response = await send(path, options);
            } else {
                useAuthStateStore.getState().logout();
            }
        }
    } catch {
        throw new ApiError(0, 'network_error', "Couldn't reach the server. Check your connection and try again.");
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) throw toApiError(response.status, data);
    return data as T;
}

export { ApiError };
