'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useAuthStateStore } from '@/lib/stateStore';
import { safeNextPath } from '@/lib/utils/NavigationUtility';
import { UserResponse } from '@/types/api';

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const router = useRouter();
    const next = safeNextPath(useSearchParams().get('next'));
    const login = useAuthStateStore((state) => state.login);

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!identifier.trim() || !password) {
            setError('Enter your email or username and your password.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await api<UserResponse>('/auth/login', { method: 'POST', body: { identifier: identifier.trim(), password } });
            login();
            router.replace(next);
            router.refresh();
        } catch (error) {
            setError(errorMessage(error));
            setIsLoading(false);
        }
    }

    return (
        <div className="flex justify-center px-4 py-12 sm:py-20">
            <div className="w-full max-w-sm rounded-2xl bg-surface p-6 sm:border sm:border-border sm:p-8">
                <h1 className="text-2xl font-extrabold">Log in</h1>
                <p className="mt-1 text-sm text-muted">Welcome back.</p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="identifier" className="text-sm font-semibold">
                            Email or username
                        </label>
                        <InputField
                            name="identifier"
                            autoComplete="username"
                            autoCapitalize="none"
                            placeholder="you@example.com"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between">
                            <label htmlFor="password" className="text-sm font-semibold">
                                Password
                            </label>
                            <Link href="/auth/forgot-password" className="text-sm text-link hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <InputField
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder=" "
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
                        {isLoading ? 'Logging in...' : 'Log in'}
                    </Button>
                    {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    New here?{' '}
                    <Link
                        href={`/auth/signup${next === '/' ? '' : `?next=${encodeURIComponent(next)}`}`}
                        className="font-semibold text-link hover:underline"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
}
