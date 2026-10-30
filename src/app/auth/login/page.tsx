'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useChallenge } from '@/components/common/Turnstile';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useAuthStateStore } from '@/lib/stateStore';
import { safeNextPath } from '@/lib/utils/NavigationUtility';
import { UserResponse } from '@/types/api';
import { describedBy, FormField } from '@/components/forms/FormField';
import { emailError } from '@/components/forms/rules';
import { useFieldErrors } from '@/components/forms/useFieldErrors';
import { connectPendingGoogle, GoogleSignIn, readPendingGoogle } from '@/components/auth/GoogleSignIn';

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
    const challenge = useChallenge(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // Sent here to connect Google to an existing account: say so, and fill in the email
    function askToLinkGoogle(email: string) {
        if (email) setIdentifier(email);
        setNotice('You already have an account with this email. Log in with your password once to connect Google.');
    }
    useEffect(() => {
        const pending = readPendingGoogle();
        // Reading this tab's session storage after the first render, so server and browser render the same
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (pending) askToLinkGoogle(pending.email);
    }, []);
    const { errors, check, recheck, checkAll } = useFieldErrors({
        // An email is checked as one; anything else is taken as a username
        identifier: () => (!identifier.trim() ? 'Enter your email or username.' : identifier.includes('@') ? emailError(identifier) : undefined),
        password: () => (password ? undefined : 'Enter your password.'),
    });

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
            await api<UserResponse>('/auth/login', { method: 'POST', body: { identifier: identifier.trim(), password, turnstile_token: challenge.token } });
            await connectPendingGoogle();
            login();
            router.replace(next);
            router.refresh();
        } catch (error) {
            challenge.afterError(error);
            setError(errorMessage(error));
            setIsLoading(false);
        }
    }

    return (
        <div className="flex justify-center px-4 py-12 sm:py-20">
            <div className="w-full max-w-sm rounded-2xl bg-surface p-6 sm:border sm:border-border sm:p-8">
                <h1 className="text-2xl font-extrabold">Log in</h1>
                <p className="mt-1 text-sm text-muted">Welcome back.</p>

                {notice && (
                    <p className="mt-4 rounded-lg bg-hover px-3 py-2 text-sm" role="status">
                        {notice}
                    </p>
                )}
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
                    <FormField name="identifier" label="Email or username" error={errors.identifier}>
                        <InputField
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder="you@example.com or ada_l"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            onBlur={() => check('identifier')}
                            onKeyUp={() => recheck('identifier')}
                            {...describedBy('identifier', errors.identifier)}
                        />
                    </FormField>

                    <FormField
                        name="password"
                        label="Password"
                        error={errors.password}
                        aside={
                            <Link href="/auth/forgot-password" className="text-sm text-link hover:underline">
                                Forgot password?
                            </Link>
                        }
                    >
                        <InputField
                            type="password"
                            autoComplete="current-password"
                            placeholder=" "
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => check('password')}
                            onKeyUp={() => recheck('password')}
                            {...describedBy('password', errors.password)}
                        />
                    </FormField>

                    {challenge.widget}
                    <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
                        {isLoading ? 'Logging in...' : 'Log in'}
                    </Button>
                    {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                </form>
                <div className="mt-4">
                    <GoogleSignIn next={next} onLinkRequired={askToLinkGoogle} />
                </div>

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
