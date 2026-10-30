'use client';

import Link from 'next/link';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useChallenge } from '@/components/common/Turnstile';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import AuthCard from '../_components/AuthCard';
import { describedBy, FormField } from '@/components/forms/FormField';
import { emailError } from '@/components/forms/rules';
import { useFieldErrors } from '@/components/forms/useFieldErrors';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const challenge = useChallenge(true);
    const { errors, check, recheck, checkAll } = useFieldErrors({ email: () => emailError(email) });

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!checkAll()) return;
        if (challenge.isPending) {
            setError('Complete the check below first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await api('/auth/forgot-password', { method: 'POST', body: { email: email.trim(), turnstile_token: challenge.token } });
            setIsSent(true);
        } catch (error) {
            challenge.afterError(error);
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
                <FormField name="email" label="Email" error={errors.email}>
                    <InputField
                        type="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => check('email')}
                        onKeyUp={() => recheck('email')}
                        {...describedBy('email', errors.email)}
                    />
                </FormField>
                {challenge.widget}
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
