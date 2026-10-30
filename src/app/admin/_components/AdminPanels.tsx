'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Plus, RotateCcw, Search, ShieldCheck, ShieldX, Trash2, UserCheck, UserX } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';
import InputField, { selectStyles } from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ActionDialog, { ActionInput } from '@/components/moderation/ActionDialog';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import TimeUtility from '@/lib/utils/TimeUtility';
import { AdminCommunity, AdminUser, BlockedTerm } from '@/types/api';

type Pending = { title: string; description?: string; confirmLabel: string; withDuration?: boolean; run: (input: ActionInput) => Promise<void> };

function SearchBar({ placeholder, onSearch, children }: { placeholder: string; onSearch: (q: string) => void; children?: React.ReactNode }) {
    const [q, setQ] = useState('');
    return (
        <form
            noValidate
            role="search"
            onSubmit={(e) => {
                e.preventDefault();
                onSearch(q.trim());
            }}
            className="flex flex-wrap gap-2"
        >
            <InputField name="q" aria-label={placeholder} placeholder={placeholder} autoCapitalize="none" className="min-w-48 flex-1" value={q} onChange={(e) => setQ(e.target.value)} />
            {children}
            <Button type="submit" variant="secondary">
                <Search className="size-4" /> Search
            </Button>
        </form>
    );
}

// --- Users: find an account, suspend it or shadow-ban it ---

// canTrust: owners and admins can mark an account trusted (it skips the new-account limits; every check still applies)
export function AdminUsers({ initialUsers, canTrust = false }: { initialUsers: AdminUser[]; canTrust?: boolean }) {
    const [users, setUsers] = useState(initialUsers);
    const [filter, setFilter] = useState('all');
    const [pending, setPending] = useState<Pending | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function search(q: string, nextFilter = filter) {
        setError(null);
        try {
            const query = new URLSearchParams({ filter: nextFilter, ...(q ? { q } : {}) });
            setUsers((await api<{ users: AdminUser[] }>(`/admin/users?${query}`)).users);
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    const replace = (updated: AdminUser) => setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));

    async function act(path: string, body: unknown) {
        const { user } = await api<{ user: AdminUser }>(path, { method: 'POST', body });
        replace(user);
    }

    async function quick(path: string, body: unknown = {}) {
        setError(null);
        try {
            await act(path, body);
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <SearchBar placeholder="Username or email" onSearch={(q) => search(q)}>
                <select
                    aria-label="Show"
                    value={filter}
                    onChange={(e) => {
                        setFilter(e.target.value);
                        void search('', e.target.value);
                    }}
                    className={twMerge(selectStyles, 'w-auto')}
                >
                    <option value="all">Everyone</option>
                    <option value="new">Joined this week</option>
                    <option value="suspended">Suspended</option>
                    <option value="shadow_banned">Shadow-banned</option>
                </select>
            </SearchBar>
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            {users.length === 0 ? (
                <p className="text-sm text-muted">No accounts match.</p>
            ) : (
                <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
                    {users.map((user) => (
                        <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                            <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-1.5">
                                    <Link href={`/u/${user.username}`} className="font-bold hover:underline" target="_blank">
                                        @{user.username}
                                    </Link>
                                    {user.role === 'admin' && <Badge variant="highlight">Admin</Badge>}
                                    {user.status === 'suspended' && (
                                        <Badge variant="danger">Suspended{user.suspended_until ? ` until ${new Date(user.suspended_until).toLocaleDateString()}` : ''}</Badge>
                                    )}
                                    {user.shadow_banned_at && <Badge variant="danger">Shadow-banned</Badge>}
                                    {user.is_trusted && <Badge variant="highlight">Trusted</Badge>}
                                    {!user.email_verified_at && <Badge>Email not verified</Badge>}
                                </p>
                                <p className="truncate text-xs text-muted">
                                    {user.email} · {user.karma} karma · {user._count.posts} posts · {user._count.comments} comments · joined{' '}
                                    <span suppressHydrationWarning>{TimeUtility.formatTimeAgo(user.created_at)}</span>
                                </p>
                                {user.suspension_reason && <p className="text-xs text-muted">Reason: {user.suspension_reason}</p>}
                            </div>
                            {user.role !== 'admin' && (
                                <div className="flex flex-wrap gap-2">
                                    {canTrust && (
                                        <Button
                                            size="sm"
                                            variant={user.is_trusted ? 'secondary' : 'outline'}
                                            title="Trusted accounts can post links and pictures from day one, without the new-account limits. All content checks still apply."
                                            onClick={() => quick(`/admin/users/${user.username}/trusted`, { trusted: !user.is_trusted })}
                                        >
                                            <ShieldCheck className="size-4" /> {user.is_trusted ? 'Remove trusted' : 'Mark trusted'}
                                        </Button>
                                    )}
                                    {user.status === 'suspended' ? (
                                        <Button size="sm" variant="secondary" onClick={() => quick(`/admin/users/${user.username}/unsuspend`)}>
                                            <UserCheck className="size-4" /> Lift suspension
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setPending({
                                                    title: `Suspend u/${user.username}?`,
                                                    description: 'Signs them out everywhere and stops them signing in until it ends.',
                                                    confirmLabel: 'Suspend',
                                                    withDuration: true,
                                                    run: (input) => act(`/admin/users/${user.username}/suspend`, input),
                                                })
                                            }
                                        >
                                            <UserX className="size-4" /> Suspend
                                        </Button>
                                    )}
                                    {user.shadow_banned_at ? (
                                        <Button size="sm" variant="secondary" onClick={() => quick(`/admin/users/${user.username}/shadow-ban`, { shadow_banned: false })}>
                                            <Eye className="size-4" /> Lift shadow-ban
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setPending({
                                                    title: `Shadow-ban u/${user.username}?`,
                                                    description: 'Everything they have written and will write is hidden from everyone but them.',
                                                    confirmLabel: 'Shadow-ban',
                                                    run: ({ reason }) => act(`/admin/users/${user.username}/shadow-ban`, { shadow_banned: true, reason }),
                                                })
                                            }
                                        >
                                            <EyeOff className="size-4" /> Shadow-ban
                                        </Button>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {pending && <PendingDialog pending={pending} onClose={() => setPending(null)} />}
        </div>
    );
}

function PendingDialog({ pending, onClose }: { pending: Pending; onClose: () => void }) {
    return (
        <ActionDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={pending.title}
            description={pending.description}
            confirmLabel={pending.confirmLabel}
            withDuration={pending.withDuration}
            onConfirm={pending.run}
        />
    );
}

// --- Communities: take down or restore, ads on or off ---

const SENSITIVE_CATEGORIES = ['health'];

function AdsSwitch({ community, onChange }: { community: AdminCommunity; onChange: (value: boolean | null) => Promise<void> }) {
    const fallback = community.is_nsfw || SENSITIVE_CATEGORIES.includes(community.category ?? '') ? 'off' : 'on';
    return (
        <select
            aria-label={`Ads in c/${community.name}`}
            value={community.ads_enabled === null ? 'default' : community.ads_enabled ? 'on' : 'off'}
            onChange={(e) => onChange(e.target.value === 'default' ? null : e.target.value === 'on')}
            className={twMerge(selectStyles, 'h-8 w-auto pl-2.5 pr-8 text-sm')}
        >
            <option value="default">Ads: default ({fallback})</option>
            <option value="on">Ads: on</option>
            <option value="off">Ads: off</option>
        </select>
    );
}

export function AdminCommunities({ initialCommunities }: { initialCommunities: AdminCommunity[] }) {
    const [communities, setCommunities] = useState(initialCommunities);
    const [pending, setPending] = useState<Pending | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function search(q: string) {
        setError(null);
        try {
            setCommunities((await api<{ communities: AdminCommunity[] }>(`/admin/communities${q ? `?q=${encodeURIComponent(q)}` : ''}`)).communities);
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    const setStatus = (name: string, status: string) =>
        setCommunities((current) => current.map((community) => (community.name === name ? { ...community, status } : community)));

    async function setAds(name: string, value: boolean | null) {
        setError(null);
        try {
            await api(`/admin/communities/${name}/ads`, { method: 'PATCH', body: { ads_enabled: value } });
            setCommunities((current) => current.map((community) => (community.name === name ? { ...community, ads_enabled: value } : community)));
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    async function restore(name: string) {
        setError(null);
        try {
            await api(`/admin/communities/${name}/restore`, { method: 'POST' });
            setStatus(name, 'active');
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <SearchBar placeholder="Community name" onSearch={search} />
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
                {communities.map((community) => (
                    <li key={community.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                        <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-1.5">
                                <Link href={`/c/${community.name}`} className="font-bold hover:underline" target="_blank">
                                    {community.name}
                                </Link>
                                {community.visibility === 'private' && <Badge>Private</Badge>}
                                {community.status === 'deleted' && <Badge variant="danger">Taken down</Badge>}
                            </p>
                            <p className="text-xs text-muted">
                                {community.member_count} members · {community.post_count} posts · created{' '}
                                <span suppressHydrationWarning>{TimeUtility.formatTimeAgo(community.created_at)}</span>
                            </p>
                        </div>
                        {community.status !== 'deleted' && <AdsSwitch community={community} onChange={(value) => setAds(community.name, value)} />}
                        {community.status === 'deleted' ? (
                            <Button size="sm" variant="secondary" onClick={() => restore(community.name)}>
                                <RotateCcw className="size-4" /> Restore
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() =>
                                    setPending({
                                        title: `Take down c/${community.name}?`,
                                        description: 'The community and its posts disappear for everyone. You can restore it later.',
                                        confirmLabel: 'Take down',
                                        run: async ({ reason }) => {
                                            await api(`/admin/communities/${community.name}/takedown`, { method: 'POST', body: { reason } });
                                            setStatus(community.name, 'deleted');
                                        },
                                    })
                                }
                            >
                                <ShieldX className="size-4" /> Take down
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
            {pending && <PendingDialog pending={pending} onClose={() => setPending(null)} />}
        </div>
    );
}

// --- Blocklist: domains and phrases that send posts to the queue ---

export function Blocklist({ initialTerms }: { initialTerms: BlockedTerm[] }) {
    const [terms, setTerms] = useState(initialTerms);
    const [kind, setKind] = useState<'domain' | 'keyword'>('domain');
    const [value, setValue] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);

    async function add(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        try {
            const { term } = await api<{ term: BlockedTerm }>('/admin/blocklist', { method: 'POST', body: { kind, value: value.trim(), note: note.trim() || undefined } });
            setTerms((current) => [...current, term]);
            setValue('');
            setNote('');
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    async function remove(term: BlockedTerm) {
        setError(null);
        try {
            await api(`/admin/blocklist/${term.id}`, { method: 'DELETE' });
            setTerms((current) => current.filter((item) => item.id !== term.id));
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={add} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4" noValidate>
                <p className="text-sm text-muted">Posts and comments that link to a blocked domain (or its subdomains) or contain a blocked phrase are held for review, not deleted.</p>
                <div className="flex flex-wrap gap-2">
                    <select
                        aria-label="Type"
                        value={kind}
                        onChange={(e) => setKind(e.target.value as 'domain' | 'keyword')}
                        className={twMerge(selectStyles, 'w-auto')}
                    >
                        <option value="domain">Domain</option>
                        <option value="keyword">Phrase</option>
                    </select>
                    <InputField
                        name="value"
                        aria-label={kind === 'domain' ? 'Domain' : 'Phrase'}
                        placeholder={kind === 'domain' ? 'example.com' : 'guaranteed returns'}
                        autoCapitalize="none"
                        className="min-w-40 flex-1"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <InputField name="note" aria-label="Note (optional)" placeholder="Note (optional)" className="min-w-40 flex-1" value={note} onChange={(e) => setNote(e.target.value)} />
                    <Button type="submit" disabled={value.trim().length < 2}>
                        <Plus className="size-4" /> Add
                    </Button>
                </div>
            </form>
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            {terms.length === 0 ? (
                <p className="text-sm text-muted">The blocklist is empty.</p>
            ) : (
                <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
                    {terms.map((term) => (
                        <li key={term.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                            <Badge>{term.kind === 'domain' ? 'Domain' : 'Phrase'}</Badge>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">{term.value}</p>
                                {term.note && <p className="truncate text-xs text-muted">{term.note}</p>}
                            </div>
                            <IconButton size="sm" aria-label={`Remove ${term.value}`} onClick={() => remove(term)}>
                                <Trash2 />
                            </IconButton>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
