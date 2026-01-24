import ErrorUtility from '@/lib/utils/ErrorUtility';
import { useState } from 'react';

export function useGET<T = unknown>() {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    async function fetchData(url: string) {
        try {
            setIsLoading(true);
            setError(null);

            if (ErrorUtility.isNullOrUndefined(url)) {
                throw new Error('URL is required');
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to get data');
            }

            const data: T = await response.json();
            setData(data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    function reset() {
        setData(null);
        setError(null);
        setIsLoading(false);
    }

    return { data, error, isLoading, fetchData, reset };
}

export function usePOST<T = unknown>() {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    async function fetchData(url: string, payload?: unknown) {
        try {
            setIsLoading(true);
            setError(null);

            if (ErrorUtility.isNullOrUndefined(url)) {
                throw new Error('URL is required');
            }

            if (ErrorUtility.isNullOrUndefined(payload)) {
                throw new Error('Payload is required');
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to post data');
            }

            const data: T = await response.json();
            setData(data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    function reset() {
        setData(null);
        setError(null);
        setIsLoading(false);
    }

    return { data, error, isLoading, fetchData, reset };
}
