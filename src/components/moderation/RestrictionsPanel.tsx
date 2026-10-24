'use client';

import { useState } from 'react';
import { Gavel, VolumeX } from 'lucide-react';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { Restriction, RestrictionsResponse } from '@/types/api';
import ActionDialog from './ActionDialog';

const untilLabel = (until: string | null) => (until ? `until ${new Date(until).toLocaleDateString()}` : 'permanently');

// Bans and mutes in one community: who has one, lifting them, and adding one by username
export function RestrictionsPanel({ community, initial }: { community: string; initial: RestrictionsResponse }) {
    const [bans, setBans] = useState(initial.bans);
    const [mutes, setMutes] = useState(initial.mutes);
    const [username, setUsername] = useState('');
    const [kind, setKind] = useState<'ban' | 'mute' | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function refresh() {
        const data = await api<RestrictionsResponse>(`/communities/${community}/restrictions`);
        setBans(data.bans);
        setMutes(data.mutes);
    }

    async function lift(type: 'ban' | 'mute', entry: Restriction) {
        setError(null);
        try {
            await api(`/communities/${community}/${type === 'ban' ? 'bans' : 'mutes'}/${entry.username}`, { method: 'DELETE' });
            await refresh();
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    const target = username.trim().replace(/^u\//, '').toLowerCase();

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
                <label htmlFor="restrict-username" className="text-sm font-semibold">
                    Ban or mute someone
                </label>
                <div className="flex flex-wrap gap-2">
                    <InputField
                        id="restrict-username"
                        name="username"
                        placeholder="Username"
                        autoCapitalize="none"
                        className="min-w-48 flex-1"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <Button variant="outline" disabled={!target} onClick={() => setKind('mute')}>
                        <VolumeX className="size-4" /> Mute
                    </Button>
                    <Button variant="danger" disabled={!target} onClick={() => setKind('ban')}>
                        <Gavel className="size-4" /> Ban
                    </Button>
                </div>
                <p className="text-xs text-muted">Muted people can read but not post or comment. Banned people can&apos;t take part or rejoin.</p>
            </form>

            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}

            <RestrictionList title="Banned" empty="Nobody is banned." entries={bans} onLift={(entry) => lift('ban', entry)} liftLabel="Lift ban" />
            <RestrictionList title="Muted" empty="Nobody is muted." entries={mutes} onLift={(entry) => lift('mute', entry)} liftLabel="Unmute" />

            {kind && (
                <ActionDialog
                    open
                    onOpenChange={(open) => !open && setKind(null)}
                    title={`${kind === 'ban' ? 'Ban' : 'Mute'} u/${target}?`}
                    confirmLabel={kind === 'ban' ? 'Ban' : 'Mute'}
                    withDuration
                    allowPermanent={kind === 'ban'}
                    onConfirm={async ({ reason, days }) => {
                        await api(`/communities/${community}/${kind === 'ban' ? 'bans' : 'mutes'}`, { method: 'POST', body: { username: target, reason, days } });
                        setUsername('');
                        await refresh();
                    }}
                />
            )}
        </div>
    );
}

function RestrictionList({
    title,
    empty,
    entries,
    onLift,
    liftLabel,
}: {
    title: string;
    empty: string;
    entries: Restriction[];
    onLift: (entry: Restriction) => void;
    liftLabel: string;
}) {
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold">
                {title} <span className="font-normal text-muted">({entries.length})</span>
            </h2>
            {entries.length === 0 ? (
                <p className="text-sm text-muted">{empty}</p>
            ) : (
                <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
                    {entries.map((entry) => (
                        <li key={entry.username} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold">u/{entry.username}</p>
                                <p className="text-xs text-muted">
                                    {untilLabel(entry.until)}
                                    {entry.reason ? ` · ${entry.reason}` : ''}
                                </p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => onLift(entry)}>
                                {liftLabel}
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default RestrictionsPanel;
