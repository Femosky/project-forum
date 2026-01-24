'use client';

import { APIUtility } from '@/lib/utils/APIUtility';
import { createContext, useState } from 'react';

export interface AuthContextType {
    user: unknown | null;
    setUser: (user: unknown | null) => void;

    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;

    error: Error | null;
    setError: (error: Error | null) => void;

    clearAuth: () => void;

    login: (email: string | undefined, username: string | undefined, password: string) => Promise<void>;
    signup: (email: string, username: string, password: string) => Promise<void>;
}

const AuthStateContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},

    isLoading: false,
    setIsLoading: () => {},

    error: null,
    setError: () => {},

    clearAuth: () => {},

    login: async () => {},
    signup: async () => {},
});

export function AuthStateProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<unknown | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    async function login(email: string | undefined, username: string | undefined, password: string) {
        setIsLoading(true);
        setError(null);

        const API_URL: string | Error = APIUtility.getApiUrl();

        // console.log('UserAgent', APIUtility.getDeviceInfo());
        // return;

        if (API_URL instanceof Error) {
            setError(API_URL);
            setIsLoading(false);
            console.log('came here');
            return;
        }

        if (!email && !username) {
            setError(new Error('Email or username is required'));
            setIsLoading(false);
            return;
        }

        if (!password) {
            setError(new Error('Password is required'));
            setIsLoading(false);
            return;
        }

        try {
            const payload = { email, username, password };
            console.log('payload', payload);
            console.log('stringified payload', JSON.stringify(payload));

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                setError(new Error(error.message));
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            if (!data.success) {
                console.log(data.error);
                setError(new Error(data.message));
                setIsLoading(false);
                return;
            }
            console.log('user', data.user);
            setUser(data.user);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unable to login'));
        } finally {
            setIsLoading(false);
        }
    }

    async function signup(email: string, username: string, password: string) {
        try {
            setIsLoading(true);
            setError(null);

            const API_URL: string | Error = APIUtility.getApiUrl();

            if (API_URL instanceof Error) {
                setError(API_URL);
                setIsLoading(false);
                return;
            }

            const payload = { email, username, password };
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                setError(new Error(error.message));
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            setUser(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unable to signup'));
        } finally {
            setIsLoading(false);
        }
    }

    function clearAuth() {
        setUser(null);
        setIsLoading(false);
        setError(null);
    }

    return (
        <AuthStateContext.Provider
            value={{ user, isLoading, error, setUser, setIsLoading, setError, login, signup, clearAuth }}
        >
            {children}
        </AuthStateContext.Provider>
    );
}

export default AuthStateContext;
