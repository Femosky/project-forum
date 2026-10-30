'use client';

import { useState } from 'react';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

// Owners and admins: emails about new reports and held content, at most one every 10 minutes
export function AlertEmailToggle({ initial }: { initial: boolean }) {
    const [isOn, setIsOn] = useState(initial);
    const [error, setError] = useState<string | null>(null);

    async function change(next: boolean) {
        setIsOn(next);
        setError(null);
        try {
            await api('/admin/auth/alerts', { method: 'PUT', body: { email: next } });
        } catch (error) {
            setIsOn(!next);
            setError(errorMessage(error));
        }
    }

    return (
        <div className="mb-3 flex flex-col gap-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" checked={isOn} onChange={(e) => change(e.target.checked)} className="size-4 accent-accent" />
                Email me about new reports and held content
            </label>
            {error && <ErrorMessage errorMessage={error} role="alert" />}
        </div>
    );
}

export default AlertEmailToggle;
