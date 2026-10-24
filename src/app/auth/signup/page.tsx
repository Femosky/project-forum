'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Button from '@/components/ui/Button';
import { useChallenge } from '@/components/common/Turnstile';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { useAuthStateStore } from '@/lib/stateStore';
import { safeNextPath } from '@/lib/utils/NavigationUtility';
import { UserResponse } from '@/types/api';

const USERNAME_PATTERN = /^[a-z][a-z0-9_]*$/;

type Fields = { email: string; username: string; password: string };

function validate(fields: Fields, isAdult: boolean): Partial<Record<keyof Fields | 'is_adult', string>> {
    const errors: Partial<Record<keyof Fields | 'is_adult', string>> = {};
    if (!/^\S+@\S+\.\S+$/.test(fields.email.trim())) errors.email = 'Enter a valid email address.';
    const username = fields.username.trim().toLowerCase();
    if (username.length < 3 || username.length > 20) errors.username = 'Usernames are 3 to 20 characters.';
    else if (!USERNAME_PATTERN.test(username)) errors.username = 'Use letters, numbers and underscores, starting with a letter.';
    if (fields.password.length < 8) errors.password = 'Use at least 8 characters.';
    if (!isAdult) errors.is_adult = 'You must be 18 or older to join.';
    return errors;
}

export default function SignupPage() {
    return (
        <Suspense>
            <SignupForm />
        </Suspense>
    );
}

function SignupForm() {
    const router = useRouter();
    const next = safeNextPath(useSearchParams().get('next'));
    const login = useAuthStateStore((state) => state.login);

    const [fields, setFields] = useState<Fields>({ email: '', username: '', password: '' });
    const [isAdult, setIsAdult] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const challenge = useChallenge(true);

    function update(name: keyof Fields) {
        return (e: React.ChangeEvent<HTMLInputElement>) => setFields((current) => ({ ...current, [name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const errors = validate(fields, isAdult);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;
        if (challenge.isPending) {
            setError('Complete the check below first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await api<UserResponse>('/auth/signup', {
                method: 'POST',
                body: { email: fields.email.trim(), username: fields.username.trim(), password: fields.password, is_adult: true, turnstile_token: challenge.token },
            });
            login();
            router.replace(next);
            router.refresh();
        } catch (error) {
            if (error instanceof ApiError && error.fields) setFieldErrors(error.fields);
            challenge.afterError(error);
            setError(errorMessage(error));
            setIsLoading(false);
        }
    }

    return (
        <div className="flex justify-center px-4 py-12 sm:py-20">
            <div className="w-full max-w-sm rounded-2xl bg-surface p-6 sm:border sm:border-border sm:p-8">
                <h1 className="text-2xl font-extrabold">Create an account</h1>
                <p className="mt-1 text-sm text-muted">Ask questions, share what you know, and vote on the best answers.</p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
                    <Field label="Email" error={fieldErrors.email}>
                        <InputField
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={fields.email}
                            onChange={update('email')}
                            outline={fieldErrors.email ? 'error' : 'default'}
                        />
                    </Field>

                    <Field label="Username" error={fieldErrors.username} hint="Shown on your posts. You can't change it later.">
                        <InputField
                            name="username"
                            autoComplete="username"
                            autoCapitalize="none"
                            placeholder="e.g. ada_l"
                            value={fields.username}
                            onChange={update('username')}
                            outline={fieldErrors.username ? 'error' : 'default'}
                        />
                    </Field>

                    <Field label="Password" error={fieldErrors.password}>
                        <InputField
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            value={fields.password}
                            onChange={update('password')}
                            outline={fieldErrors.password ? 'error' : 'default'}
                        />
                    </Field>

                    <div className="flex flex-col gap-1.5">
                        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                            <input
                                type="checkbox"
                                checked={isAdult}
                                onChange={(e) => setIsAdult(e.target.checked)}
                                className="mt-0.5 size-4 accent-accent"
                            />
                            I&apos;m 18 or older
                        </label>
                        {fieldErrors.is_adult && <ErrorMessage errorMessage={fieldErrors.is_adult} />}
                    </div>

                    {challenge.widget}
                    <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
                        {isLoading ? 'Creating your account...' : 'Sign up'}
                    </Button>
                    {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                    <p className="text-center text-xs text-muted">
                        By signing up you agree to the{' '}
                        <Link href="/policies/terms" className="text-link hover:underline">
                            terms
                        </Link>{' '}
                        and{' '}
                        <Link href="/policies/privacy" className="text-link hover:underline">
                            privacy policy
                        </Link>
                        .
                    </p>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    Already have an account?{' '}
                    <Link
                        href={`/auth/login${next === '/' ? '' : `?next=${encodeURIComponent(next)}`}`}
                        className="font-semibold text-link hover:underline"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
    const id = label.toLowerCase();
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-semibold">
                {label}
            </label>
            {children}
            {error ? <ErrorMessage errorMessage={error} /> : hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
    );
}
