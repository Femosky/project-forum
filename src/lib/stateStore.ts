import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { APIUtility } from './utils/APIUtility';

type AuthStateStore = {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
};

export const useAuthStateStore = create<AuthStateStore>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            login: () => set({ isAuthenticated: true }),
            logout: () => set({ isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : ({} as Storage))),
        }
    )
);
