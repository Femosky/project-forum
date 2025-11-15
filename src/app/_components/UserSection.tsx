'use client';

import useAuth from '@/hooks/auth';
import { Button } from '@/components/ui/Button';

export function UserSection() {
    const { user } = useAuth();
    return (
        <section className="w-full flex justify-end items-center gap-2 shrink-0">
            {user ? (
                <div>
                    <Button>Create Post</Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Button>Login</Button>
                    <Button>Sign up</Button>
                </div>
            )}
        </section>
    );
}
