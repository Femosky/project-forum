'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import AuthCard from '@/app/auth/_components/AuthCard';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

// From the link in a moderator email. It asks for a click, so mail scanners that open links don't unsubscribe anyone.
function Unsubscribe() {
    const token = useSearchParams().get('token') ?? '';
    const [community, setCommunity] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function confirm() {
        setError(null);
        try {
            const result = await api<{ community: string }>('/moderation/email-unsubscribe', { method: 'POST', body: { token } });
            setCommunity(result.community);
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    if (community) {
        return (
            <AuthCard title="Emails stopped" subtitle={`You won't get moderator emails for c/${community} any more.`}>
                <p className="mt-4 text-sm text-muted">
                    You can turn them back on from{' '}
                    <Link href="/moderation" className="font-semibold text-link hover:underline">
                        Moderation
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
                    Stop emails for this community
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
