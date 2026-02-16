'use client';

import { useEffect } from 'react';
import { useAuthStateStore } from '@/lib/stateStore';

export function AuthHydrator({ isAuthenticated }: { isAuthenticated: boolean }) {
    const login = useAuthStateStore((s) => s.login);
    const logout = useAuthStateStore((s) => s.logout);

    useEffect(() => {
        if (isAuthenticated) {
            login();
        } else {
            logout();
        }
    }, [isAuthenticated, login, logout]);

    return null;
}
