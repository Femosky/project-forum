'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import AuthCard from '@/app/auth/_components/AuthCard';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

// What the link stops, read from the token's unsigned part (the API checks the signature). Kinds as in the API's
// lib/emailTokens.ts.
function whatStops(token: string): string {
    try {
        const [kind, , ref] = atob(token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')).split(':');
        if (kind === 'hide' && ref) return `Hide c/${ref} from your digest?`;
        const label = ({ digest: 'digest emails', replies: 'reply emails', mentions: 'mention emails', mod: 'moderator emails' } as Record<string, string>)[kind];
        if (label) return `Stop ${label}?`;
    } catch {
        // Not a token we can read; the API will say so
    }
    return 'Stop these emails?';
}

// From the link in an email. It asks for a click, so mail scanners that open links don't unsubscribe anyone.
function Unsubscribe() {
    const token = useSearchParams().get('token') ?? '';
    const [done, setDone] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function confirm() {
        setError(null);
        try {
            const result = await api<{ done: string }>('/email/unsubscribe', { method: 'POST', body: { token } });
            setDone(result.done);
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    if (done) {
        return (
            <AuthCard title="Done" subtitle={`You won't get ${done} any more.`}>
                <p className="mt-4 text-sm text-muted">
                    Change this any time in{' '}
                    <Link href="/settings" className="font-semibold text-link hover:underline">
                        Settings
                    </Link>
                    .
                </p>
            </AuthCard>
        );
    }
    return (
        <AuthCard title={whatStops(token)} subtitle="You'll still see what's waiting on the site.">
            <div className="mt-6 flex flex-col gap-3">
                <Button size="lg" className="w-full" onClick={confirm} disabled={!token}>
                    Yes, stop them
                </Button>
                {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            </div>
        </AuthCard>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense>
            <Unsubscribe />
        </Suspense>
    );
}
