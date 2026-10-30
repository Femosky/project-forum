'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import TimeUtility from '@/lib/utils/TimeUtility';
import { JoinRequest } from '@/types/api';

// People asking to join a private community
export function JoinRequests({ community, initial }: { community: string; initial: JoinRequest[] }) {
    const [requests, setRequests] = useState(initial);
    const [error, setError] = useState<string | null>(null);

    async function decide(request: JoinRequest, decision: 'accept' | 'reject') {
        setError(null);
        try {
            await api(`/communities/${community}/join-requests/${request.id}`, { method: 'POST', body: { decision } });
            setRequests((current) => current.filter((item) => item.id !== request.id));
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    if (requests.length === 0) return <EmptyState icon={<UserPlus />} title="No requests" description="When someone asks to join, they'll show up here." />;

    return (
        <div className="flex flex-col gap-2">
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
                {requests.map((request) => (
                    <li key={request.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">{request.user.username}</p>
                            <p className="text-xs text-muted">
                                Joined the site {TimeUtility.formatTimeAgo(request.user.created_at)}, asked {TimeUtility.formatTimeAgo(request.created_at)}
                            </p>
                            {request.message && <p className="mt-1 text-sm">{request.message}</p>}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => decide(request, 'reject')}>
                            Decline
                        </Button>
                        <Button size="sm" onClick={() => decide(request, 'accept')}>
                            Accept
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default JoinRequests;
