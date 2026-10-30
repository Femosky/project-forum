'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import AuthCard from '@/app/auth/_components/AuthCard';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

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
        <AuthCard title="Stop these emails?" subtitle="You'll still see what's waiting on the site.">
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
