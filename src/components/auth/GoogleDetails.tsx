'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { describedBy, FormField } from '@/components/forms/FormField';
import { usernameError } from '@/components/forms/rules';
import { useFieldErrors } from '@/components/forms/useFieldErrors';
import { useUsernameCheck } from '@/components/forms/useUsernameCheck';
import { ApiError, errorMessage } from '@/lib/api/errors';

// The last step of joining with Google, shown in place of the button: pick a username and confirm 18+. Loaded only
// when someone gets here.
export default function GoogleDetailsDialog({
    credential,
    suggested,
    onClose,
    onJoined,
    postGoogle,
}: {
    credential: string;
    suggested: string;
    onClose: () => void;
    onJoined: () => void;
    postGoogle: (body: Record<string, unknown>) => Promise<void>;
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
            await postGoogle({
                id_token: credential,
                username: username.trim().toLowerCase(),
                is_adult: true,
            });
            onJoined();
        } catch (error) {
            if (error instanceof ApiError && error.fields?.username) setErrors({ google_username: error.fields.username });
            else setError(errorMessage(error));
            setIsSaving(false);
        }
    }

    return (
        <section className="flex flex-col gap-3 rounded-xl border border-border p-4" aria-labelledby="google-details-title">
            <div>
                <h2 id="google-details-title" className="font-bold">
                    One more step: pick a username
                </h2>
                <p className="text-sm text-muted">Shown on your posts instead of your name. You can&apos;t change it later.</p>
            </div>
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
                                if (e.target.checked)
                                    setErrors((current) => ({
                                        ...current,
                                        google_is_adult: undefined,
                                    }));
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
                <button type="button" onClick={onClose} className="text-sm text-muted hover:underline">
                    Cancel
                </button>
            </form>
        </section>
    );
}
