'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, ShieldCheck } from 'lucide-react';
import AuthCard from '@/app/auth/_components/AuthCard';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useChallenge } from '@/components/common/Turnstile';
import { describedBy, FormField } from '@/components/forms/FormField';
import { emailError, PASSWORD_MIN } from '@/components/forms/rules';
import { useFieldErrors } from '@/components/forms/useFieldErrors';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { StaffAccount } from '@/types/api';

type Step = 'password' | 'setup_2fa' | 'verify_2fa' | 'recovery_codes' | 'new_password';
type Setup = { secret: string; otpauth_url: string; qr_svg: string };

// Admin panel sign-in, for staff accounts only (separate from forum accounts): email and password, then a code
// from an authenticator app. The first time, the app is set up here and ten recovery codes are shown once. A
// temporary password (from the setup script) is changed before anything else.
export default function AdminLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('password');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [useRecovery, setUseRecovery] = useState(false);
    const [setup, setSetup] = useState<Setup | null>(null);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [newPassword, setNewPassword] = useState('');
    const [staff, setStaff] = useState<StaffAccount | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const challenge = useChallenge(true);
    const { errors, check, recheck, checkAll } = useFieldErrors({
        email: () => emailError(email),
        password: () => (password ? undefined : 'Enter your password.'),
    });

    // Arriving signed in but on a temporary password
    useEffect(() => {
        api<{ staff: StaffAccount }>('/admin/auth/me')
            .then(({ staff }) => (staff.password_change_required ? setStep('new_password') : router.replace('/admin')))
            .catch(() => undefined);
    }, [router]);

    useEffect(() => {
        if (step !== 'setup_2fa' || setup) return;
        api<Setup>('/admin/auth/2fa/setup')
            .then(setSetup)
            .catch((error) => setError(errorMessage(error)));
    }, [step, setup]);

    async function run(action: () => Promise<void>) {
        setBusy(true);
        setError(null);
        try {
            await action();
        } catch (error) {
            challenge.afterError(error);
            setError(errorMessage(error));
        } finally {
            setBusy(false);
        }
    }

    const finish = (account: StaffAccount) => {
        setStaff(account);
        if (account.password_change_required) setStep('new_password');
        else {
            router.replace('/admin');
            router.refresh();
        }
    };

    const submitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkAll()) return;
        if (challenge.isPending) return setError('Complete the check below first.');
        void run(async () => {
            const { step: next } = await api<{ step: Step }>('/admin/auth/login', {
                method: 'POST',
                body: { email: email.trim(), password, turnstile_token: challenge.token },
            });
            setCode('');
            setStep(next);
        });
    };

    const submitSetup = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) return setError('Enter the 6-digit code from your app.');
        void run(async () => {
            const result = await api<{ recovery_codes: string[]; staff: StaffAccount }>('/admin/auth/2fa/setup', { method: 'POST', body: { code } });
            setRecoveryCodes(result.recovery_codes);
            setStaff(result.staff);
            setStep('recovery_codes');
        });
    };

    const submitVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (useRecovery ? !code.trim() : code.length !== 6) return setError(useRecovery ? 'Enter a recovery code.' : 'Enter the 6-digit code from your app.');
        void run(async () => {
            const result = await api<{ staff: StaffAccount }>('/admin/auth/2fa/verify', {
                method: 'POST',
                body: useRecovery ? { recovery_code: code } : { code },
            });
            finish(result.staff);
        });
    };

    const submitNewPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return setError('Enter your temporary password.');
        if (newPassword.length < PASSWORD_MIN) return setError(`Use at least ${PASSWORD_MIN} characters.`);
        void run(async () => {
            await api('/admin/auth/password', { method: 'POST', body: { current_password: password, new_password: newPassword } });
            router.replace('/admin');
            router.refresh();
        });
    };

    const field = 'mt-5 flex flex-col gap-3';

    if (step === 'password') {
        return (
            <AuthCard title="Admin sign-in" subtitle="For staff accounts. Your forum account doesn't work here.">
                <form onSubmit={submitPassword} className={field} noValidate>
                    <FormField name="email" label="Email" error={errors.email}>
                        <InputField
                            type="email"
                            autoComplete="username"
                            autoCapitalize="none"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => check('email')}
                            onKeyUp={() => recheck('email')}
                            {...describedBy('email', errors.email)}
                        />
                    </FormField>
                    <FormField name="password" label="Password" error={errors.password}>
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
                    {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                    <Button type="submit" disabled={busy}>
                        {busy ? 'Checking...' : 'Continue'}
                    </Button>
                </form>
            </AuthCard>
        );
    }

    if (step === 'setup_2fa') {
        return (
            <AuthCard title="Set up two-factor sign-in" subtitle="Scan this with an authenticator app (Google Authenticator, 1Password, Authy), then type the 6-digit code it shows.">
                <form onSubmit={submitSetup} className={field} noValidate>
                    {setup ? (
                        <>
                            {/* Our own API's QR code, an SVG of the otpauth link */}
                            <div className="mx-auto size-44 rounded-lg bg-white p-2" dangerouslySetInnerHTML={{ __html: setup.qr_svg }} />
                            <p className="text-center text-xs text-muted">
                                Can&apos;t scan? Enter this key:{' '}
                                <code className="select-all break-all font-mono text-text">{setup.secret.match(/.{1,4}/g)?.join(' ')}</code>
                            </p>
                        </>
                    ) : (
                        <div className="mx-auto size-44 rounded-lg bg-surface-muted" />
                    )}
                    <InputField name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                    {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                    <Button type="submit" disabled={busy}>
                        Turn on two-factor
                    </Button>
                </form>
            </AuthCard>
        );
    }

    if (step === 'recovery_codes') {
        return (
            <AuthCard title="Save your recovery codes" subtitle="If you lose your phone, each of these signs you in once. They won't be shown again.">
                <div className={field}>
                    <ul className="grid grid-cols-2 gap-2 rounded-lg bg-surface-muted p-3 font-mono text-sm">
                        {recoveryCodes.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                    <Button variant="secondary" onClick={() => void navigator.clipboard?.writeText(recoveryCodes.join('\n'))}>
                        <Copy className="size-4" /> Copy codes
                    </Button>
                    <Button onClick={() => staff && finish(staff)}>
                        <ShieldCheck className="size-4" /> I&apos;ve saved them
                    </Button>
                </div>
            </AuthCard>
        );
    }

    if (step === 'verify_2fa') {
        return (
            <AuthCard title="Two-factor sign-in" subtitle={useRecovery ? 'Enter one of your recovery codes.' : 'Enter the 6-digit code from your authenticator app.'}>
                <form onSubmit={submitVerify} className={field} noValidate>
                    <InputField
                        name="code"
                        inputMode={useRecovery ? 'text' : 'numeric'}
                        autoComplete="one-time-code"
                        placeholder={useRecovery ? 'abcd-efgh' : '123456'}
                        maxLength={useRecovery ? 9 : 6}
                        value={code}
                        onChange={(e) => setCode(useRecovery ? e.target.value : e.target.value.replace(/\D/g, ''))}
                    />
                    {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                    <Button type="submit" disabled={busy}>
                        Sign in
                    </Button>
                    <button
                        type="button"
                        className="cursor-pointer text-sm text-link hover:underline"
                        onClick={() => {
                            setUseRecovery(!useRecovery);
                            setCode('');
                        }}
                    >
                        {useRecovery ? 'Use the authenticator app instead' : 'Lost your phone? Use a recovery code'}
                    </button>
                </form>
            </AuthCard>
        );
    }

    return (
        <AuthCard title="Choose a new password" subtitle="You signed in with a temporary password. Pick your own to continue.">
            <form onSubmit={submitNewPassword} className={field} noValidate>
                {!password && (
                    <InputField name="current" type="password" autoComplete="current-password" placeholder="Temporary password" value={password} onChange={(e) => setPassword(e.target.value)} />
                )}
                <InputField name="new" type="password" autoComplete="new-password" placeholder={`New password (${PASSWORD_MIN}+ characters)`} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                <Button type="submit" disabled={busy}>
                    Save and continue
                </Button>
            </form>
        </AuthCard>
    );
}
