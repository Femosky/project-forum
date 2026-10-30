'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Monitor, Moon, Smartphone, Sun } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { applyTheme, ThemeChoice, useThemeChoice } from '@/components/theme/ThemeMenu';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { API_BASE, DATA_SAVER_COOKIE_NAME, Theme } from '@/lib/constants';
import { useAuthStateStore } from '@/lib/stateStore';
import TimeUtility from '@/lib/utils/TimeUtility';
import { PrivateUser, Session } from '@/types/api';
import { describedBy, FormField } from '@/components/forms/FormField';
import { PasswordStrength } from '@/components/forms/PasswordStrength';
import { emailError, newPasswordError, PASSWORD_MIN } from '@/components/forms/rules';
import { useFieldErrors } from '@/components/forms/useFieldErrors';

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-4 border-b border-border bg-surface px-4 py-5 sm:rounded-xl sm:border">
            <div>
                <h2 className="text-lg font-bold">{title}</h2>
                {description && <p className="text-sm text-muted">{description}</p>}
            </div>
            {children}
        </section>
    );
}

function Field({ label, name, children }: { label: string; name: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={name} className="text-sm font-semibold">
                {label}
            </label>
            {children}
        </div>
    );
}

// Status line under a form: the API's error, or a short confirmation
function FormStatus({ error, success }: { error: string | null; success: string | null }) {
    if (error) return <ErrorMessage size="small" errorMessage={error} role="alert" />;
    if (success) return <p className="text-sm text-success" role="status">{success}</p>;
    return null;
}

function useFormState() {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function run(task: () => Promise<string>) {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            setSuccess(await task());
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    return { isSaving, error, success, run };
}

export function ProfileForm({ user }: { user: PrivateUser }) {
    const [displayName, setDisplayName] = useState(user.display_name ?? '');
    const { isSaving, error, success, run } = useFormState();
    const router = useRouter();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        run(async () => {
            await api('/users/me', { method: 'PATCH', body: { display_name: displayName.trim() || null } });
            router.refresh();
            return 'Saved.';
        });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <Field label="Display name" name="display_name">
                <InputField
                    name="display_name"
                    placeholder={user.username}
                    maxLength={30}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
            </Field>
            <p className="text-xs text-muted">Shown on your profile. Your username, @{user.username}, can&apos;t change.</p>
            <FormStatus error={error} success={success} />
            <Button type="submit" className="self-start" disabled={isSaving || displayName.trim() === (user.display_name ?? '')}>
                {isSaving ? 'Saving...' : 'Save'}
            </Button>
        </form>
    );
}

const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

export function ThemePicker({ initialTheme }: { initialTheme: Theme | null }) {
    const [choice, setChoice] = useThemeChoice(initialTheme);

    return (
        <div role="radiogroup" aria-label="Theme" className="flex gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={choice === value}
                    onClick={() => {
                        setChoice(value);
                        applyTheme(value);
                    }}
                    className={twMerge(
                        'flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-colors',
                        choice === value ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong hover:bg-surface-muted'
                    )}
                >
                    <Icon className="size-4" /> {label}
                </button>
            ))}
        </div>
    );
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Saved as a cookie so the server marks <html data-save-data> from the next page on; applied right away here
export function DataSaverToggle({ initialEnabled }: { initialEnabled: boolean }) {
    const [enabled, setEnabled] = useState(initialEnabled);

    function toggle() {
        const next = !enabled;
        setEnabled(next);
        document.documentElement.toggleAttribute('data-save-data', next);
        document.cookie = `${DATA_SAVER_COOKIE_NAME}=${next ? 'on' : 'off'}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    }

    return (
        <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm">Hide link preview images and profile pictures</span>
            <input type="checkbox" role="switch" checked={enabled} onChange={toggle} className="size-5 shrink-0 accent-accent" />
        </label>
    );
}

// Off by default. On: mature (NSFW) posts and communities show in feeds, search and the directory, without the blur.
// Saved to the account, so it follows the reader to other devices; pages pick it up on the next load.
export function MatureContentToggle({ initialEnabled }: { initialEnabled: boolean }) {
    const router = useRouter();
    const [enabled, setEnabled] = useState(initialEnabled);
    const { error, run } = useFormState();

    function toggle() {
        const next = !enabled;
        setEnabled(next);
        void run(async () => {
            try {
                await api('/users/me', { method: 'PATCH', body: { show_mature: next } });
            } catch (error) {
                setEnabled(!next);
                throw error;
            }
            router.refresh();
            return '';
        });
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center justify-between gap-4">
                <span className="text-sm">Show mature content</span>
                <input type="checkbox" role="switch" checked={enabled} onChange={toggle} className="size-5 shrink-0 accent-accent" />
            </label>
            <FormStatus error={error} success={null} />
        </div>
    );
}

export function PasswordForm({ user }: { user: PrivateUser }) {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const { isSaving, error, success, run } = useFormState();
    const { errors, check, recheck, checkAll } = useFieldErrors({
        current_password: () => (user.has_password && !current ? 'Enter your current password.' : undefined),
        new_password: () => newPasswordError(next, user),
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!checkAll()) return;
        run(async () => {
            await api('/auth/change-password', {
                method: 'POST',
                body: { ...(user.has_password ? { current_password: current } : {}), new_password: next },
            });
            setCurrent('');
            setNext('');
            return 'Password changed. Your other devices have been signed out.';
        });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            {user.has_password && (
                <FormField name="current_password" label="Current password" error={errors.current_password}>
                    <InputField
                        type="password"
                        autoComplete="current-password"
                        placeholder=" "
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                        onBlur={() => check('current_password')}
                        onKeyUp={() => recheck('current_password')}
                        {...describedBy('current_password', errors.current_password)}
                    />
                </FormField>
            )}
            <FormField
                name="new_password"
                label={user.has_password ? 'New password' : 'Set a password'}
                error={errors.new_password}
                hint="Not your username or email."
            >
                <InputField
                    type="password"
                    autoComplete="new-password"
                    placeholder={`At least ${PASSWORD_MIN} characters`}
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    onBlur={() => check('new_password')}
                    onKeyUp={() => recheck('new_password')}
                    {...describedBy('new_password', errors.new_password)}
                />
                <PasswordStrength password={next} />
            </FormField>
            <FormStatus error={error} success={success} />
            <Button type="submit" className="self-start" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Change password'}
            </Button>
        </form>
    );
}

export function EmailForm({ user }: { user: PrivateUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { isSaving, error, success, run } = useFormState();
    const { errors, check, recheck, checkAll } = useFieldErrors({
        new_email: () => emailError(email) ?? (email.trim().toLowerCase() === user.email ? 'That is already your email.' : undefined),
        email_password: () => (password ? undefined : 'Enter your password.'),
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!checkAll()) return;
        run(async () => {
            await api('/auth/change-email', { method: 'POST', body: { new_email: email.trim(), password } });
            setPassword('');
            return `Check ${email.trim()} for a link to confirm the change.`;
        });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <p className="text-sm">
                Current: <span className="font-semibold">{user.email}</span>
                {!user.is_email_verified && <span className="text-muted"> (not confirmed yet)</span>}
            </p>
            {user.has_password ? (
                <>
                    <FormField name="new_email" label="New email" error={errors.new_email}>
                        <InputField
                            type="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => check('new_email')}
                            onKeyUp={() => recheck('new_email')}
                            {...describedBy('new_email', errors.new_email)}
                        />
                    </FormField>
                    <FormField name="email_password" label="Your password" error={errors.email_password}>
                        <InputField
                            type="password"
                            autoComplete="current-password"
                            placeholder=" "
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => check('email_password')}
                            onKeyUp={() => recheck('email_password')}
                            {...describedBy('email_password', errors.email_password)}
                        />
                    </FormField>
                    <FormStatus error={error} success={success} />
                    <Button type="submit" className="self-start" disabled={isSaving}>
                        {isSaving ? 'Sending...' : 'Change email'}
                    </Button>
                </>
            ) : (
                <p className="text-sm text-muted">Set a password first to change the email on a Google sign-in account.</p>
            )}
        </form>
    );
}

function describeSession(session: Session): string {
    const device = [session.browser, session.os].filter(Boolean).join(' on ') || 'Unknown device';
    const place = [session.city, session.country].filter(Boolean).join(', ');
    return place ? `${device} · ${place}` : device;
}

export function SessionsList({ initialSessions }: { initialSessions: Session[] }) {
    const [sessions, setSessions] = useState(initialSessions);
    const { isSaving, error, success, run } = useFormState();
    const others = sessions.filter((session) => !session.current);

    function signOut(id: string) {
        run(async () => {
            await api(`/auth/sessions/${id}`, { method: 'DELETE' });
            setSessions((current) => current.filter((session) => session.id !== id));
            return 'Signed out that device.';
        });
    }

    function signOutOthers() {
        run(async () => {
            await api('/auth/sessions', { method: 'DELETE' });
            setSessions((current) => current.filter((session) => session.current));
            return 'Signed out every other device.';
        });
    }

    return (
        <div className="flex flex-col gap-3">
            <ul className="flex flex-col divide-y divide-border">
                {sessions.map((session) => (
                    <li key={session.id} className="flex items-center gap-3 py-2.5">
                        <Smartphone className="size-5 shrink-0 text-muted" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{describeSession(session)}</p>
                            <p className="text-xs text-muted">
                                {session.current
                                    ? 'This device'
                                    : `Last active ${TimeUtility.formatTimeAgo(session.last_used_at ?? session.created_at)}`}
                            </p>
                        </div>
                        {!session.current && (
                            <Button size="sm" variant="outline" onClick={() => signOut(session.id)} disabled={isSaving}>
                                Sign out
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
            <FormStatus error={error} success={success} />
            {others.length > 0 && (
                <Button variant="secondary" className="self-start" onClick={signOutOthers} disabled={isSaving}>
                    Sign out all other devices
                </Button>
            )}
        </div>
    );
}

export function ExportData() {
    return (
        <Button asChild variant="secondary" className="self-start">
            {/* The API sends it as a file download with your auth cookie */}
            <a href={`${API_BASE}/users/me/export`} download>
                <Download className="size-4" /> Download my data
            </a>
        </Button>
    );
}

export function DeleteAccount({ user }: { user: PrivateUser }) {
    const [isOpen, setIsOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const { isSaving, error, run } = useFormState();
    const logout = useAuthStateStore((state) => state.logout);

    function handleDelete(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        run(async () => {
            await api('/users/me', { method: 'DELETE', body: user.has_password ? { password } : {} });
            logout();
            window.location.href = '/';
            return '';
        });
    }

    return (
        <>
            <Button variant="danger" className="self-start" onClick={() => setIsOpen(true)}>
                Delete my account
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    title="Delete your account?"
                    description="You'll be signed out everywhere and your username freed. Your posts and comments stay, without your name on them. This can't be undone."
                >
                    <form onSubmit={handleDelete} className="flex flex-col gap-3" noValidate>
                        {user.has_password && (
                            <Field label="Your password" name="delete_password">
                                <InputField
                                    type="password"
                                    name="delete_password"
                                    autoComplete="current-password"
                                    placeholder=" "
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </Field>
                        )}
                        <Field label={`Type ${user.username} to confirm`} name="delete_confirm">
                            <InputField
                                name="delete_confirm"
                                autoCapitalize="none"
                                placeholder={user.username}
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                            />
                        </Field>
                        <FormStatus error={error} success={null} />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="danger"
                                disabled={isSaving || confirmText !== user.username || (user.has_password && !password)}
                            >
                                {isSaving ? 'Deleting...' : 'Delete account'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
