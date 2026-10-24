'use client';

import Link from 'next/link';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import AuthCard from '../_components/AuthCard';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            setError('Enter a valid email address.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await api('/auth/forgot-password', { method: 'POST', body: { email: email.trim() } });
            setIsSent(true);
        } catch (error) {
            setError(errorMessage(error));
        }
        setIsLoading(false);
    }

    if (isSent) {
        return (
            <AuthCard title="Check your email">
                <p className="mt-4 text-sm">
                    If {email.trim()} has an account, a link to choose a new password is on its way. It works for one hour. Check your
                    spam folder if it doesn&apos;t arrive in a few minutes.
                </p>
                <p className="mt-6 text-center text-sm text-muted">
                    <Link href="/auth/login" className="font-semibold text-link hover:underline">
                        Back to log in
                    </Link>
                </p>
            </AuthCard>
        );
    }

    return (
        <AuthCard title="Forgot your password?" subtitle="Enter your account's email and we'll send you a link to choose a new one.">
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-semibold">
                        Email
                    </label>
                    <InputField
                        type="email"
                        name="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
                    {isLoading ? 'Sending...' : 'Send reset link'}
                </Button>
                {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            </form>
            <p className="mt-6 text-center text-sm text-muted">
                Remembered it?{' '}
                <Link href="/auth/login" className="font-semibold text-link hover:underline">
                    Log in
                </Link>
            </p>
        </AuthCard>
    );
}
