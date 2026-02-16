'use client';

import { useAuthStateStore } from '@/lib/stateStore';
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

    async function refreshAccessToken(): Promise<T | Error> {
        try {
            const response = await fetch(`${APIUtility.getApiUrl()}/auth/refresh-token`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                const data = await response.json();

                if (response.status === 401) {
                    console.log('REFRESH', data);
                    throw new Error(data?.error?.message || 'Failed to refresh token');
                }

                throw new Error('Failed to refresh token');
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error || data.error.message);
            }

            return data;
        } catch (error) {
            return error as Error;
        }
    }

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

    async function sendData(url: string, payload?: unknown) {
        if (isLoading) return;

        try {
            setIsLoading(true);
            reset();

            if (ErrorUtility.isNullOrUndefined(url)) {
                throw new Error('URL is required');
            }

            if (ErrorUtility.isNullOrUndefined(payload)) {
                throw new Error('Payload is required');
            }

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                // If the status is 401 (Unauthorized), refresh the access token
                if (response.status === 401) {
                    const refreshedData = await refreshAccessToken();

                    if (refreshedData instanceof Error) {
                        // If the refresh token fails, logout the user TODO: Get error types from backend
                        triggerLogout();
                        throw refreshedData;
                    }

                    await sendData(url, payload);
                }

                console.log('error response from usePOST: ', data);
                throw new Error(data?.error?.message || 'Failed to post data');
            }

            if (data.error) {
                console.log('data from error: ', data.error);
                throw new Error(data.error || data.error.message);
            }

            console.log('data from usePOST: ', data);

            setData(data);
        } catch (error) {
            console.log('error from usePOST: ', error);
            setError(error as Error);
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
