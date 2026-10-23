'use client';

import { useAuthStateStore } from '@/lib/stateStore';
import { useUIStore } from '@/lib/uiStore';

// Returns a guard for actions that need an account: signed-in users pass, guests get the sign-in prompt
export function useRequireAuth() {
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);
    const promptSignIn = useUIStore((state) => state.promptSignIn);

    return function requireAuth(reason: string): boolean {
        if (isAuthenticated) return true;
        promptSignIn(reason);
        return false;
    };
}
