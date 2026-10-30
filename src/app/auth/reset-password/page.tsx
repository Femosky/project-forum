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
import { describedBy, FormField } from '@/components/forms/FormField';
import { PasswordStrength } from '@/components/forms/PasswordStrength';
import { newPasswordError, PASSWORD_MIN } from '@/components/forms/rules';
import { useFieldErrors } from '@/components/forms/useFieldErrors';
import { ApiError } from '@/lib/api/errors';

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
    const { errors, setErrors, check, recheck, checkAll } = useFieldErrors({ password: () => newPasswordError(password) });

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!checkAll()) return;
        setIsLoading(true);
        setError(null);
        try {
            await api('/auth/reset-password', { method: 'POST', body: { token, password } });
            setIsDone(true);
        } catch (error) {
            // A refused password keeps the link usable, so it's shown on the field rather than as a dead link
            if (error instanceof ApiError && error.fields?.password) setErrors({ password: error.fields.password });
            else setError(errorMessage(error));
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
            <FormField name="password" label="New password" error={errors.password} hint="Not your username or email.">
                <InputField
                    type="password"
                    autoComplete="new-password"
                    placeholder={`At least ${PASSWORD_MIN} characters`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => check('password')}
                    onKeyUp={() => recheck('password')}
                    {...describedBy('password', errors.password)}
                />
                <PasswordStrength password={password} />
            </FormField>
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
