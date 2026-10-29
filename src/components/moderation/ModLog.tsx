'use client';

import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { actionLabel } from '@/lib/moderation';
import TimeUtility from '@/lib/utils/TimeUtility';
import { ModLogEntry, ModLogResponse } from '@/types/api';

// Who did what, when and why. `path` is the API list (a community's mod log or the site-wide one).
export function ModLog({ path, initial }: { path: string; initial: ModLogResponse }) {
    const [actions, setActions] = useState<ModLogEntry[]>(initial.actions);
    const [cursor, setCursor] = useState(initial.next_cursor);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadMore() {
        if (!cursor) return;
        setIsLoading(true);
        setError(null);
        try {
            const page = await api<ModLogResponse>(`${path}?cursor=${encodeURIComponent(cursor)}`);
            setActions((current) => [...current, ...page.actions]);
            setCursor(page.next_cursor);
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }

    if (actions.length === 0) return <EmptyState icon={<ScrollText />} title="No actions yet" />;

    return (
        <div className="flex flex-col gap-3">
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
                {actions.map((entry) => (
                    <li key={entry.id} className="flex flex-col gap-0.5 px-4 py-3 text-sm">
                        <p>
                            <span className="font-semibold">{entry.actor ? `@${entry.actor.username}` : entry.staff ? `${entry.staff.name} (site staff)` : 'Site staff'}</span>{' '}
                            {actionLabel(entry.action)}
                            {entry.community && <span className="text-muted"> in {entry.community.name}</span>}
                        </p>
                        {entry.reason && <p className="text-muted">Reason: {entry.reason}</p>}
                        <time dateTime={entry.created_at} className="text-xs text-muted" suppressHydrationWarning>
                            {TimeUtility.formatTimeAgo(entry.created_at)}
                        </time>
                    </li>
                ))}
            </ul>
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            {cursor && (
                <Button variant="secondary" onClick={loadMore} disabled={isLoading} className="self-center">
                    {isLoading ? 'Loading...' : 'Show older'}
                </Button>
            )}
        </div>
    );
}

export default ModLog;
