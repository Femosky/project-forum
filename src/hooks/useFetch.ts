import ErrorUtility from '@/lib/utils/ErrorUtility';
import { useState } from 'react';

export function useFetch<T = unknown>() {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Returns the response data on success, or null on failure (the error is kept in state)
    async function fetchData(url: string): Promise<T | null> {
        if (isLoading) return null;

        try {
            setIsLoading(true);
            reset();

            if (ErrorUtility.isNullOrUndefined(url)) {
                throw new Error('URL is required');
            }

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to get data');
            }

            const data = await response.json();
            if (data.error) {
                console.log('data from error: ', data.error);
                throw new Error(data.error || data.error.message);
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

    return { data, error, isLoading, fetchData, reset };
}
