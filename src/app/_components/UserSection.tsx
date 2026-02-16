'use client';

import { Button } from '@/components/ui/Button';
import { useFetch } from '@/hooks/useFetch';
import { usePOST } from '@/hooks/usePOST';
import { useAuthStateStore } from '@/lib/stateStore';
import { APIUtility } from '@/lib/utils/APIUtility';
import ErrorUtility from '@/lib/utils/ErrorUtility';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function UserSection() {
    const router = useRouter();
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);
    const login = useAuthStateStore((state) => state.login);
    const logout = useAuthStateStore((state) => state.logout);

    const { data, error, isLoading, fetchData } = useFetch();

    async function handleLogout() {
        console.log('logging out', data, error);
        await fetchData(`${APIUtility.getApiUrl()}/auth/logout`);
    }
    useEffect(() => {
        if (!ErrorUtility.isNullOrUndefined(data)) {
            console.log('ran 2');
            console.log('logout successful: ', data);
            logout();
        }
    }, [data, logout]);

    useEffect(() => {
        if (!ErrorUtility.isNullOrUndefined(error)) {
            logout();
            // Refresh the page
            console.log('refreshing page');
            window.location.reload();
        }
    }, [error, logout, router]);

    return (
        <section className="w-full flex justify-end items-center gap-2 shrink-0">
            {isAuthenticated ? (
                <div>
                    <Button>Create Post</Button>
                    <Button variant={isLoading ? 'disabled' : 'hot'} onClick={handleLogout} disabled={isLoading}>
                        {isLoading ? 'Logging out...' : 'Logout'}
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.push('/auth/login')}>Login</Button>
                    <Button onClick={() => router.push('/auth/signup')}>Sign up</Button>
                </div>
            )}
        </section>
    );
}
