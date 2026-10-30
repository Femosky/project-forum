'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthCard from '@/app/auth/_components/AuthCard';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { PASSWORD_MIN } from '@/components/forms/rules';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

// The link from a staff invite email: pick a password, then sign in at /admin/login (where two-factor is set up)
function InviteForm() {
    const token = useSearchParams().get('token') ?? '';
    const [invite, setInvite] = useState<{ email: string; name: string; role: string } | null>(null);
    const [password, setPassword] = useState('');
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api<{ email: string; name: string; role: string }>(`/admin/auth/invite/${encodeURIComponent(token)}`)
            .then(setInvite)
            .catch((error) => setError(errorMessage(error)));
    }, [token]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (password.length < PASSWORD_MIN) return setError(`Use at least ${PASSWORD_MIN} characters.`);
        setError(null);
        try {
            await api(`/admin/auth/invite/${encodeURIComponent(token)}`, { method: 'POST', body: { password } });
            setDone(true);
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    if (done) {
        return (
            <AuthCard title="Password set" subtitle="Now sign in. You'll set up an authenticator app on the way in.">
                <Button asChild className="mt-5 w-full">
                    <Link href="/admin/login">Go to admin sign-in</Link>
                </Button>
            </AuthCard>
        );
    }
    return (
        <AuthCard title="Join the admin team" subtitle={invite ? `${invite.name} (${invite.email}), role: ${invite.role}` : undefined}>
            <form onSubmit={submit} className="mt-5 flex flex-col gap-3" noValidate>
                <InputField name="password" type="password" autoComplete="new-password" placeholder={`Choose a password (${PASSWORD_MIN}+ characters)`} value={password} onChange={(e) => setPassword(e.target.value)} />
                {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                <Button type="submit" disabled={!invite}>
                    Set password
                </Button>
            </form>
        </AuthCard>
    );
}

export default function AdminInvitePage() {
    return (
        <Suspense fallback={null}>
            <InviteForm />
        </Suspense>
    );
}
