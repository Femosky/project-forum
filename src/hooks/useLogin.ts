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

            const response = await fetch(`${APIUtility.getApiUrl()}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to login');
                return false;
            }

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
