'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

// Finishes an emailed link (?token=...) with a button press rather than on page load, so mail scanners that open
// links don't use the token up first
export default function ConfirmLink({ endpoint, action, done }: { endpoint: string; action: string; done: string }) {
    const token = useSearchParams().get('token') ?? '';
    const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
    const [error, setError] = useState<string | null>(null);

    async function confirm() {
        setState('loading');
        setError(null);
        try {
            await api(endpoint, { method: 'POST', body: { token } });
            setState('done');
        } catch (error) {
            setError(errorMessage(error));
            setState('idle');
        }
    }

    if (!token) return <ErrorMessage className="mt-6" errorMessage="This link is incomplete. Open it again from the email." />;
    if (state === 'done') {
        return (
            <div className="mt-6 flex flex-col gap-4">
                <p className="text-sm">{done}</p>
                <Button asChild size="lg" className="w-full">
                    <Link href="/">Go to the home page</Link>
                </Button>
            </div>
        );
    }
    return (
        <div className="mt-6 flex flex-col gap-4">
            <Button size="lg" className="w-full" disabled={state === 'loading'} onClick={confirm}>
                {state === 'loading' ? 'One moment...' : action}
            </Button>
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
        </div>
    );
}
