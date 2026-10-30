'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import { selectStyles } from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { ModEmailFrequency } from '@/types/api';

export function InviteAnswer({ id }: { id: string }) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    async function answer(decision: 'accept' | 'decline') {
        setError(null);
        try {
            await api(`/moderation/invites/${id}`, { method: 'POST', body: { decision } });
            window.location.reload();
        } catch (error) {
            setError(errorMessage(error));
            router.refresh();
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => answer('decline')}>
                    Decline
                </Button>
                <Button size="sm" onClick={() => answer('accept')}>
                    Accept
                </Button>
            </div>
            {error && <ErrorMessage errorMessage={error} role="alert" />}
        </div>
    );
}

export function EmailChoice({ community, initial }: { community: string; initial: ModEmailFrequency }) {
    const [value, setValue] = useState(initial);
    const [error, setError] = useState<string | null>(null);

    async function change(next: ModEmailFrequency) {
        const previous = value;
        setValue(next);
        setError(null);
        try {
            await api(`/communities/${community}/mod-email`, { method: 'PUT', body: { frequency: next } });
        } catch (error) {
            setValue(previous);
            setError(errorMessage(error));
        }
    }

    return (
        <label className="flex items-center gap-2 text-xs text-muted">
            Email me
            <select className={twMerge(selectStyles, 'h-8 w-auto text-sm')} value={value} onChange={(e) => change(e.target.value as ModEmailFrequency)}>
                <option value="instant">Right away</option>
                <option value="daily">Daily digest</option>
                <option value="off">Never</option>
            </select>
            {error && <ErrorMessage errorMessage={error} role="alert" />}
        </label>
    );
}
