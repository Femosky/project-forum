'use client';

import { useAuthStateStore } from '@/lib/stateStore';
import APIService from '@/lib/services/APIService';
import { APIUtility } from '@/lib/utils/APIUtility';
import ErrorUtility from '@/lib/utils/ErrorUtility';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function usePOST<T = unknown>() {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const logout = useAuthStateStore((state) => state.logout);
    const router = useRouter();

    async function triggerLogout(): Promise<void> {
        try {
            const response = await fetch(`${APIUtility.getApiUrl()}/auth/logout`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data?.error?.message || 'Failed to logout');
            }
        } catch (error) {
            console.log('error logging out', error);
        } finally {
            logout();
            router.push('/auth/login');
        }
    }

    async function request(url: string, payload?: unknown): Promise<Response> {
        // No payload means a GET request
        if (ErrorUtility.isNullOrUndefined(payload)) {
            return fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        return fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
    }

    // Returns the response data on success, or null on failure (the error is kept in state)
    async function sendData(url: string, payload?: unknown): Promise<T | null> {
        if (isLoading) return null;

        try {
            setIsLoading(true);
            reset();

            if (ErrorUtility.isNullOrUndefined(url)) {
                throw new Error('URL is required');
            }

            let response = await request(url, payload);

            // If the status is 401 (Unauthorized), refresh the access token and retry once.
            // Auth endpoints (e.g. a wrong password on login) return 401 for their own reasons.
            if (response.status === 401 && !url.includes('/auth/')) {
                const refreshedData = await APIService.refreshAccessToken();

                if (refreshedData instanceof Error) {
                    // If the refresh token fails, logout the user TODO: Get error types from backend
                    triggerLogout();
                    throw refreshedData;
                }

                response = await request(url, payload);
            }

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data?.error?.message || data?.error || 'Failed to post data');
            }

            setData(data);
            return data as T;
        } catch (error) {
            setError(error as Error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }

    function reset() {
        setData(null);
        setError(null);
        setIsLoading(false);
    }

    return { data, error, isLoading, sendData, reset };
}
