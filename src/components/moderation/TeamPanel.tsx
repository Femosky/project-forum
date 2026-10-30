'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import InputField, { selectStyles } from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { ModPermission, TeamResponse } from '@/types/api';

const PERMISSION_LABELS: Record<ModPermission, string> = { lead: 'Lead mod', all: 'Everything', posts: 'Posts only' };

// Who moderates this community. The owner and Lead mods invite people (they accept), set what they can do and remove
// them. Only the owner makes Lead mods or hands the community over. A moderator can step down.
type TeamPanelProps = { community: string; initial: TeamResponse; viewerRole: string | null; viewerPermission: ModPermission | null; viewerName: string };

export function TeamPanel({ community, initial, viewerRole, viewerPermission, viewerName }: TeamPanelProps) {
    const router = useRouter();
    const [team, setTeam] = useState(initial);
    const [username, setUsername] = useState('');
    const [permission, setPermission] = useState<ModPermission>('all');
    const [error, setError] = useState<string | null>(null);
    const isOwner = viewerRole === 'owner';
    const canManage = isOwner || viewerPermission === 'lead';
    const levels: ModPermission[] = isOwner ? ['lead', 'all', 'posts'] : ['all', 'posts'];
    const base = `/communities/${community}`;

    async function run(action: () => Promise<unknown>) {
        setError(null);
        try {
            await action();
            setTeam(await api<TeamResponse>(`${base}/team`));
            router.refresh();
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    function invite(e: React.FormEvent) {
        e.preventDefault();
        const target = username.trim().replace(/^u\//, '').toLowerCase();
        if (!target) return setError('Enter a username.');
        void run(async () => {
            await api(`${base}/team/invites`, { method: 'POST', body: { username: target, permission } });
            setUsername('');
        });
    }

    function transfer(name: string) {
        if (window.confirm(`Hand ${community} over to ${name}? You'll stay on as a moderator, and only they can undo this.`)) {
            void run(() => api(`${base}/transfer`, { method: 'POST', body: { username: name } }));
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {canManage && (
                <form onSubmit={invite} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4" noValidate>
                    <label htmlFor="invite-username" className="text-sm font-semibold">
                        Invite a moderator
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <InputField
                            id="invite-username"
                            name="username"
                            autoCapitalize="none"
                            placeholder="Username"
                            className="min-w-40 flex-1"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <select aria-label="What they can do" className={twMerge(selectStyles, 'w-auto')} value={permission} onChange={(e) => setPermission(e.target.value as ModPermission)}>
                            {levels.map((level) => (
                                <option key={level} value={level}>
                                    {PERMISSION_LABELS[level]}
                                </option>
                            ))}
                        </select>
                        <Button type="submit">Invite</Button>
                    </div>
                    <p className="text-xs text-muted">They become a moderator once they accept. Lead mods can also manage moderators. Posts only means the queue and reports, without bans, join requests or settings.</p>
                </form>
            )}
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}

            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
                {team.moderators.map((mod) => (
                    <li key={mod.username} className="flex flex-wrap items-center gap-2 px-4 py-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">{mod.username}</p>
                            <p className="text-xs text-muted">{mod.role === 'owner' ? 'Owner' : `Moderator · ${PERMISSION_LABELS[mod.permission]}`}</p>
                        </div>
                        {canManage && mod.role === 'moderator' && mod.username !== viewerName && (isOwner || mod.permission !== 'lead') && (
                            <>
                                <select
                                    aria-label={`What ${mod.username} can do`}
                                    className={twMerge(selectStyles, 'w-auto')}
                                    value={mod.permission}
                                    onChange={(e) => run(() => api(`${base}/team/${mod.username}`, { method: 'PATCH', body: { permission: e.target.value } }))}
                                >
                                    {levels.map((level) => (
                                        <option key={level} value={level}>
                                            {PERMISSION_LABELS[level]}
                                        </option>
                                    ))}
                                </select>
                                {isOwner && (
                                    <Button size="sm" variant="ghost" onClick={() => transfer(mod.username)}>
                                        Make owner
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => run(() => api(`${base}/team/${mod.username}`, { method: 'DELETE' }))}>
                                    Remove
                                </Button>
                            </>
                        )}
                        {mod.role === 'moderator' && mod.username === viewerName && (
                            <Button size="sm" variant="ghost" onClick={() => run(() => api(`${base}/team/${mod.username}`, { method: 'DELETE' }))}>
                                Step down
                            </Button>
                        )}
                    </li>
                ))}
                {team.invites.map((invite) => (
                    <li key={invite.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">{invite.username}</p>
                            <p className="text-xs text-muted">Invited · {PERMISSION_LABELS[invite.permission]}</p>
                        </div>
                        {canManage && (
                            <Button size="sm" variant="ghost" onClick={() => run(() => api(`${base}/team/invites/${invite.id}`, { method: 'DELETE' }))}>
                                Cancel
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TeamPanel;
