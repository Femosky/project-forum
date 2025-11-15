'use client';

import { createContext, useState } from 'react';

export interface AuthContextType {
    user: unknown | null;
    setUser: (user: unknown | null) => void;

    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;

    error: string | null;
    setError: (error: string | null) => void;

    clearAuth: () => void;
}

const AuthStateContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},

    isLoading: false,
    setIsLoading: () => {},

    error: null,
    setError: () => {},

    clearAuth: () => {},
});

export function AuthStateProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<unknown | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const clearAuth = () => {
        setUser(null);
        setIsLoading(false);
        setError(null);
    };

    return (
        <AuthStateContext.Provider value={{ user, isLoading, error, setUser, setIsLoading, setError, clearAuth }}>
            {children}
        </AuthStateContext.Provider>
    );
}

export default AuthStateContext;
