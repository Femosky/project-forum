'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import AuthCard from '../_components/AuthCard';

export default function ResetPasswordPage() {
    return (
        <AuthCard title="Choose a new password" subtitle="You'll be signed out everywhere else, then you can log in with it.">
            <Suspense>
                <ResetForm />
            </Suspense>
        </AuthCard>
    );
}

function ResetForm() {
    const token = useSearchParams().get('token') ?? '';
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (password.length < 8) {
            setError('Use at least 8 characters.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await api('/auth/reset-password', { method: 'POST', body: { token, password } });
            setIsDone(true);
        } catch (error) {
            setError(errorMessage(error));
        }
        setIsLoading(false);
    }

    if (!token) {
        return (
            <p className="mt-6 text-sm">
                This link is incomplete. Open it again from the email, or{' '}
                <Link href="/auth/forgot-password" className="font-semibold text-link hover:underline">
                    ask for a new one
                </Link>
                .
            </p>
        );
    }
    if (isDone) {
        return (
            <div className="mt-6 flex flex-col gap-4">
                <p className="text-sm">Your password is changed.</p>
                <Button asChild size="lg" className="w-full">
                    <Link href="/auth/login">Log in</Link>
                </Button>
            </div>
        );
    }
    return (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold">
                    New password
                </label>
                <InputField
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
                {isLoading ? 'Saving...' : 'Save new password'}
            </Button>
            {error && (
                <div className="flex flex-col gap-1">
                    <ErrorMessage size="small" errorMessage={error} role="alert" />
                    <Link href="/auth/forgot-password" className="text-sm font-semibold text-link hover:underline">
                        Send a new link
                    </Link>
                </div>
            )}
        </form>
    );
}
