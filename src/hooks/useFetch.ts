import ErrorUtility from '@/lib/utils/ErrorUtility';
import { useState } from 'react';

export function useFetch<T = unknown>() {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    async function fetchData(url: string) {
        if (isLoading) return;

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
        } catch (error) {
            console.log('error from useFetch: ', error);
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

    return { data, error, isLoading, fetchData, reset };
}
