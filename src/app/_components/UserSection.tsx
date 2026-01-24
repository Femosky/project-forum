'use client';

import useAuth from '@/hooks/auth';
import { Button } from '@/components/ui/Button';

export function UserSection() {
    const { user, isLoading, login } = useAuth();

    function handleLogin() {
        login('femi@oje.com', undefined, 'password');
    }

    function handleLogout() {
        console.log('Logout');
    }

    return (
        <section className="w-full flex justify-end items-center gap-2 shrink-0">
            {isLoading ? (
                <div>Loading...</div>
            ) : user ? (
                <div>
                    <Button>Create Post</Button>
                    <Button onClick={handleLogout}>Logout</Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Button onClick={handleLogin}>Login</Button>
                    <Button>Sign up</Button>
                </div>
            )}
        </section>
    );
}
