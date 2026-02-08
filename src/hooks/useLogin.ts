'use client';

import { useState } from 'react';
import ErrorUtility from '@/lib/utils/ErrorUtility';
import { APIUtility } from '@/lib/utils/APIUtility';

export function useLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function login(email: string | undefined, username: string | undefined, password: string): Promise<boolean> {
        setIsLoading(true);
        setError(null);

        try {
            if (ErrorUtility.isNullOrUndefined(email) && ErrorUtility.isNullOrUndefined(username)) {
                setError('Email or username is required');
                return false;
            }

            const payload = {
                email: email,
                username: username,
                password: password,
            };

            console.log(payload);

            const response = await fetch(`${APIUtility.getApiUrl()}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error.message || 'Failed to login');
                return false;
            }

            if (data.error) {
                setError(data.error.message);
                return false;
            }

            console.log(data);

            return true;
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
            return false;
        }
    }

    function reset() {
        setError(null);
        setIsLoading(false);
    }

    return { isLoading, error, login, reset };
}
