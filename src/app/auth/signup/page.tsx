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
import { trackConversion } from '@/lib/googleAds';
import { describedBy, FormField } from '@/components/forms/FormField';
import { PasswordStrength } from '@/components/forms/PasswordStrength';
import { emailError, newPasswordError, PASSWORD_MIN, usernameError } from '@/components/forms/rules';
import { useFieldErrors } from '@/components/forms/useFieldErrors';
import { useUsernameCheck } from '@/components/forms/useUsernameCheck';
import { LazyGoogleSignIn } from '@/components/auth/LazyGoogleSignIn';

type Fields = { email: string; username: string; password: string };

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
    const { errors: fieldErrors, setErrors: setFieldErrors, check, recheck, checkAll } = useFieldErrors({
        email: () => emailError(fields.email),
        username: () => usernameError(fields.username) ?? (availability.state === 'taken' ? availability.message : undefined),
        password: () => newPasswordError(fields.password, fields),
        is_adult: () => (isAdult ? undefined : 'You must be 18 or older to join.'),
    });
    const availability = useUsernameCheck(fields.username);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const challenge = useChallenge(true);

    function update(name: keyof Fields) {
        return {
            value: fields[name],
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFields((current) => ({ ...current, [name]: e.target.value })),
            onBlur: () => check(name),
            onKeyUp: () => recheck(name),
        };
    }

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
            await api<UserResponse>('/auth/signup', {
                method: 'POST',
                body: { email: fields.email.trim(), username: fields.username.trim(), password: fields.password, is_adult: true, turnstile_token: challenge.token },
            });
            login();
            trackConversion('sign_up');
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
                    <FormField name="email" label="Email" error={fieldErrors.email}>
                        <InputField
                            type="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            placeholder="you@example.com"
                            {...update('email')}
                            {...describedBy('email', fieldErrors.email)}
                        />
                    </FormField>

                    <FormField
                        name="username"
                        label="Username"
                        error={fieldErrors.username}
                        hint={
                            availability.state === 'checking'
                                ? 'Checking...'
                                : availability.state === 'available'
                                  ? <span className="text-success">{availability.message}</span>
                                  : availability.state === 'taken'
                                    ? <span className="text-danger">{availability.message}</span>
                                    : '3 to 20 letters, numbers or underscores. You can\'t change it later.'
                        }
                    >
                        <InputField
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder="e.g. ada_l"
                            {...update('username')}
                            {...describedBy('username', fieldErrors.username)}
                            onKeyUp={() => check('username')}
                        />
                    </FormField>

                    <FormField name="password" label="Password" error={fieldErrors.password} hint="Not your username or email.">
                        <InputField
                            type="password"
                            autoComplete="new-password"
                            placeholder={`At least ${PASSWORD_MIN} characters`}
                            {...update('password')}
                            {...describedBy('password', fieldErrors.password)}
                        />
                        <PasswordStrength password={fields.password} />
                    </FormField>

                    <div className="flex flex-col gap-1.5">
                        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                            <input
                                type="checkbox"
                                checked={isAdult}
                                id="is_adult"
                                aria-describedby="is_adult-message"
                                onChange={(e) => {
                                    setIsAdult(e.target.checked);
                                    if (e.target.checked) setFieldErrors((current) => ({ ...current, is_adult: undefined }));
                                }}
                                className="mt-0.5 size-4 accent-accent"
                            />
                            I&apos;m 18 or older
                        </label>
                        <p id="is_adult-message" aria-live="polite" className="min-h-4 text-xs text-danger">
                            {fieldErrors.is_adult}
                        </p>
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
                <div className="mt-4">
                    <LazyGoogleSignIn
                        next={next}
                        onLinkRequired={() => router.push(`/auth/login${next === '/' ? '' : `?next=${encodeURIComponent(next)}`}`)}
                    />
                </div>

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
