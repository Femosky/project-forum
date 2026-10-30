'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { describedBy, FormField } from '@/components/forms/FormField';
import { usernameError } from '@/components/forms/rules';
import { useFieldErrors } from '@/components/forms/useFieldErrors';
import { useUsernameCheck } from '@/components/forms/useUsernameCheck';
import { api } from '@/lib/api/client';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { useAuthStateStore } from '@/lib/stateStore';
import { UserResponse } from '@/types/api';

// "Continue with Google" on the log-in and sign-up pages. Hidden unless NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
// Google's script loads only on these pages, when the button is shown. A new person picks a username and confirms
// they're 18+ in a dialog; an email that already has an account is connected only after a password log-in (the
// token waits in this tab's session storage for the log-in page, see connectPendingGoogle).

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const PENDING_KEY = 'pending_google';

type GoogleId = {
    initialize(options: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: 'popup' }): void;
    renderButton(element: HTMLElement, options: Record<string, unknown>): void;
};

let loading: Promise<GoogleId> | null = null;
function loadGoogle(): Promise<GoogleId> {
    loading ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => resolve((window as unknown as { google: { accounts: { id: GoogleId } } }).google.accounts.id);
        script.onerror = () => {
            loading = null;
            reject(new Error('Google sign-in could not load.'));
        };
        document.head.appendChild(script);
    });
    return loading;
}

type Pending = { credential: string; email: string };

export function readPendingGoogle(): Pending | null {
    try {
        const raw = sessionStorage.getItem(PENDING_KEY);
        return raw ? (JSON.parse(raw) as Pending) : null;
    } catch {
        return null;
    }
}

// After a password log-in: connects the Google account the person tried to continue with, if any
export async function connectPendingGoogle() {
    const pending = readPendingGoogle();
    if (!pending) return;
    try {
        sessionStorage.removeItem(PENDING_KEY);
        await api('/auth/google/link', { method: 'POST', body: { id_token: pending.credential } });
    } catch {
        // The Google token may have expired; they can connect it again later
    }
}

export function GoogleSignIn({ next, onLinkRequired }: { next: string; onLinkRequired: (email: string) => void }) {
    const router = useRouter();
    const login = useAuthStateStore((state) => state.login);
    const container = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [details, setDetails] = useState<{ credential: string; suggested: string } | null>(null);

    function finish() {
        login();
        router.replace(next);
        router.refresh();
    }

    async function continueWith(credential: string) {
        setError(null);
        try {
            await api<UserResponse>('/auth/google', { method: 'POST', body: { id_token: credential } });
            finish();
        } catch (error) {
            if (error instanceof ApiError && error.code === 'google_signup_details') {
                setDetails({ credential, suggested: String(error.details?.suggested_username ?? '') });
            } else if (error instanceof ApiError && error.code === 'google_link_required') {
                const email = String(error.details?.email ?? '');
                try {
                    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ credential, email }));
                } catch {
                    // Without storage they can still log in and connect Google later
                }
                onLinkRequired(email);
            } else {
                setError(errorMessage(error));
            }
        }
    }

    useEffect(() => {
        if (!CLIENT_ID || !container.current) return;
        const element = container.current;
        loadGoogle()
            .then((google) => {
                google.initialize({ client_id: CLIENT_ID, callback: ({ credential }) => void continueWith(credential), ux_mode: 'popup' });
                const theme = document.documentElement.dataset.theme;
                const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
                google.renderButton(element, {
                    type: 'standard',
                    theme: dark ? 'filled_black' : 'outline',
                    size: 'large',
                    shape: 'pill',
                    text: 'continue_with',
                    width: element.clientWidth,
                });
            })
            .catch((error: Error) => setError(error.message));
        // continueWith only reads state through setters; the button is set up once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!CLIENT_ID) return null;
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
            </div>
            {/* Same height as Google's button, so nothing moves when it appears */}
            <div ref={container} className="flex h-10 w-full justify-center" />
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            {details && (
                <GoogleDetailsDialog
                    credential={details.credential}
                    suggested={details.suggested}
                    onClose={() => setDetails(null)}
                    onJoined={finish}
                />
            )}
        </div>
    );
}

function GoogleDetailsDialog({
    credential,
    suggested,
    onClose,
    onJoined,
}: {
    credential: string;
    suggested: string;
    onClose: () => void;
    onJoined: () => void;
}) {
    const [username, setUsername] = useState(suggested);
    const [isAdult, setIsAdult] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const availability = useUsernameCheck(username);
    const { errors, setErrors, check, checkAll } = useFieldErrors({
        google_username: () => usernameError(username) ?? (availability.state === 'taken' ? availability.message : undefined),
        google_is_adult: () => (isAdult ? undefined : 'You must be 18 or older to join.'),
    });

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!checkAll()) return;
        setIsSaving(true);
        setError(null);
        try {
            await api<UserResponse>('/auth/google', {
                method: 'POST',
                body: { id_token: credential, username: username.trim().toLowerCase(), is_adult: true },
            });
            onJoined();
        } catch (error) {
            if (error instanceof ApiError && error.fields?.username) setErrors({ google_username: error.fields.username });
            else setError(errorMessage(error));
            setIsSaving(false);
        }
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent title="Pick a username" description="Shown on your posts instead of your name. You can't change it later.">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
                    <FormField
                        name="google_username"
                        label="Username"
                        error={errors.google_username}
                        hint={
                            availability.state === 'checking' ? (
                                'Checking...'
                            ) : availability.state === 'available' ? (
                                <span className="text-success">{availability.message}</span>
                            ) : availability.state === 'taken' ? (
                                <span className="text-danger">{availability.message}</span>
                            ) : (
                                '3 to 20 letters, numbers or underscores.'
                            )
                        }
                    >
                        <InputField
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyUp={() => check('google_username')}
                            {...describedBy('google_username', errors.google_username)}
                        />
                    </FormField>
                    <div className="flex flex-col gap-1.5">
                        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                            <input
                                id="google_is_adult"
                                type="checkbox"
                                checked={isAdult}
                                aria-describedby="google_is_adult-message"
                                onChange={(e) => {
                                    setIsAdult(e.target.checked);
                                    if (e.target.checked) setErrors((current) => ({ ...current, google_is_adult: undefined }));
                                }}
                                className="mt-0.5 size-4 accent-accent"
                            />
                            I&apos;m 18 or older
                        </label>
                        <p id="google_is_adult-message" aria-live="polite" className="min-h-4 text-xs text-danger">
                            {errors.google_is_adult}
                        </p>
                    </div>
                    {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                    <Button type="submit" size="lg" disabled={isSaving} className="w-full">
                        {isSaving ? 'Creating your account...' : 'Join'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
