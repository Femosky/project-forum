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
    const { data, error, reset, isLoading, sendData } = usePOST();
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
        console.log('datdjmkw');
        if (!ErrorUtility.isNullOrUndefined(data)) {
            login();
            router.push('/');
        }
    }, [data, login, router]);

    return (
        <div className="place-self-center py-40">
            <h1 className="text-2xl text-center">Login</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-md">
                <div className="flex flex-col gap-1">
                    <InputField
                        type="text"
                        name="email"
                        value={email}
                        onChange={handleEmailTyping}
                        outline={emailError ? 'error' : 'default'}
                    />
                    {emailError && <ErrorMessage errorMessage={emailError} />}
                </div>

                <div className="flex flex-col gap-2">
                    <InputField
                        type="password"
                        name="password"
                        value={password}
                        onChange={handlePasswordTyping}
                        outline={passwordError ? 'error' : 'default'}
                    />
                    {passwordError && <ErrorMessage errorMessage={passwordError} />}
                </div>

                <Button variant={isLoading ? 'disabled' : 'default'} type="submit" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                {/* {isLoading && <p>Loading..;</p>} */}
            </form>
        </div>
    );
}
