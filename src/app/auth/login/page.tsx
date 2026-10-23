'use client';

import Button from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import { APIUtility } from '@/lib/utils/APIUtility';
import { usePOST } from '@/hooks/usePOST';
import { useEffect, useState } from 'react';
import z from 'zod';
import { PASSWORD_SPECIAL_CHARACTERS, PASSWORD_SPECIAL_CHARACTERS_REGEX } from '@/lib/constants';
import { useAuthStateStore } from '@/lib/stateStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ErrorUtility from '@/lib/utils/ErrorUtility';
import ErrorMessage from '@/components/ui/ErrorMessage';

const formSchema = z.object({
    email: z.email(),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long' })
        .max(20, { message: 'Password must be less than 20 characters' })
        .refine((val) => /[A-Z]/.test(val), {
            message: 'Password must contain at least one uppercase letter',
        })
        .refine((val) => /[a-z]/.test(val), {
            message: 'Password must contain at least one lowercase letter',
        })
        .refine((val) => /[0-9]/.test(val), {
            message: 'Password must contain at least one number',
        })
        .refine((val) => PASSWORD_SPECIAL_CHARACTERS_REGEX.test(val), {
            message: `Password must contain at least one special character (e.g. ${PASSWORD_SPECIAL_CHARACTERS})`,
        }),
});

export default function LoginPage() {
    const router = useRouter();
    const { data, error, isLoading, sendData } = usePOST();
    const login = useAuthStateStore((state) => state.login);
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    function handleEmailTyping(e: React.ChangeEvent<HTMLInputElement>) {
        const newEmail = e.target.value;
        setEmail(newEmail);

        const validatedResults = formSchema.safeParse({
            email: newEmail,
            password,
        });

        if (!validatedResults.success) {
            const errors = validatedResults.error.format();
            setEmailError(errors.email?._errors[0] || null);
        } else {
            setEmailError(null);
        }
    }

    function handlePasswordTyping(e: React.ChangeEvent<HTMLInputElement>) {
        const newPassword = e.target.value;
        setPassword(newPassword);

        const validatedResults = formSchema.safeParse({
            email,
            password: newPassword,
        });

        if (!validatedResults.success) {
            const errors = validatedResults.error.format();
            setPasswordError(errors.password?._errors[0] || null);
        } else {
            setPasswordError(null);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        // Validate the form
        // const validatedResults = formSchema.safeParse({ email, password });

        // if (validatedResults.error) {
        //     console.log('error: ', validatedResults.error);
        //     return;
        // }

        await sendData(`${APIUtility.getApiUrl()}/auth/login`, { email, password });
    }

    useEffect(() => {
        // redirect to home if user is already logged in
        if (isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!ErrorUtility.isNullOrUndefined(data)) {
            login();
            router.push('/');
        }
    }, [data, login, router]);

    return (
        <div className="flex justify-center px-4 py-12 sm:py-20">
            <div className="w-full max-w-sm rounded-2xl bg-surface p-6 sm:border sm:border-border sm:p-8">
                <h1 className="text-2xl font-extrabold">Log in</h1>
                <p className="mt-1 text-sm text-muted">Welcome back.</p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-sm font-semibold">
                            Email
                        </label>
                        <InputField
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={handleEmailTyping}
                            outline={emailError ? 'error' : 'default'}
                        />
                        {emailError && <ErrorMessage errorMessage={emailError} />}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="text-sm font-semibold">
                            Password
                        </label>
                        <InputField
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder=" "
                            value={password}
                            onChange={handlePasswordTyping}
                            outline={passwordError ? 'error' : 'default'}
                        />
                        {passwordError && <ErrorMessage errorMessage={passwordError} />}
                    </div>

                    <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
                        {isLoading ? 'Logging in...' : 'Log in'}
                    </Button>
                    {error && <ErrorMessage size="small" errorMessage={error.message} role="alert" />}
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    New here?{' '}
                    <Link href="/auth/signup" className="font-semibold text-link hover:underline">
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
}
