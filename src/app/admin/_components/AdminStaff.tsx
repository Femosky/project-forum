'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, LogOut, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import InputField, { selectStyles } from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import TimeUtility from '@/lib/utils/TimeUtility';
import { StaffAccount, StaffAuditEntry, StaffRole } from '@/types/api';

const ROLES: { id: StaffRole; label: string; description: string }[] = [
    { id: 'owner', label: 'Owner', description: 'Everything, including admin accounts' },
    { id: 'admin', label: 'Admin', description: 'Everything except admin accounts' },
    { id: 'moderator', label: 'Moderator', description: 'Queue, users, communities, blocklist, logs' },
    { id: 'ads', label: 'Ads manager', description: 'Ads and stats' },
];
const roleLabel = (role: StaffRole) => ROLES.find((item) => item.id === role)?.label ?? role;

// Who is signed in to the panel, with a sign-out
export function StaffBar({ staff }: { staff: StaffAccount }) {
    const router = useRouter();
    return (
        <div className="flex items-center gap-2 text-sm text-muted">
            <span>
                {staff.name} · {roleLabel(staff.role)}
            </span>
            <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                    await api('/admin/auth/logout', { method: 'POST' }).catch(() => undefined);
                    router.replace('/admin/login');
                }}
            >
                <LogOut className="size-4" /> Sign out
            </Button>
        </div>
    );
}

// Admins tab (owner only): invite by email, change roles, deactivate, reset two-factor, send a new password link
export function AdminStaff({ me, initial }: { me: StaffAccount; initial: StaffAccount[] }) {
    const [staff, setStaff] = useState(initial);
    const [inviting, setInviting] = useState(false);
    const [form, setForm] = useState({ email: '', name: '', role: 'moderator' as StaffRole });
    const [link, setLink] = useState<{ email: string; url: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function reload() {
        setStaff((await api<{ staff: StaffAccount[] }>('/admin/staff')).staff);
    }

    async function act(action: () => Promise<unknown>) {
        setError(null);
        try {
            await action();
            await reload();
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    const invite = (e: React.FormEvent) => {
        e.preventDefault();
        void act(async () => {
            const result = await api<{ staff: StaffAccount; invite_url: string }>('/admin/staff', { method: 'POST', body: { ...form, email: form.email.trim(), name: form.name.trim() } });
            setLink({ email: result.staff.email, url: result.invite_url });
            setForm({ email: '', name: '', role: 'moderator' });
            setInviting(false);
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted">Admin accounts are separate from forum accounts. Everyone signs in at /admin/login with a password and an authenticator app.</p>
                <Button size="sm" onClick={() => setInviting(!inviting)}>
                    <Plus className="size-4" /> Invite an admin
                </Button>
            </div>

            {inviting && (
                <form onSubmit={invite} className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
                    <InputField name="email" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <InputField name="name" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })} className={selectStyles}>
                        {ROLES.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.label}: {role.description}
                            </option>
                        ))}
                    </select>
                    <div className="flex justify-end gap-2 sm:col-span-3">
                        <Button variant="ghost" onClick={() => setInviting(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Send invite</Button>
                    </div>
                </form>
            )}

            {link && (
                <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-sm">
                    <p>
                        Invite sent to <b>{link.email}</b>. The link works once for 7 days; if the email doesn&apos;t arrive, send them this:
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 select-all truncate rounded bg-surface-muted px-2 py-1 font-mono text-xs">{link.url}</code>
                        <Button variant="secondary" size="sm" onClick={() => void navigator.clipboard?.writeText(link.url)}>
                            <Copy className="size-4" /> Copy
                        </Button>
                    </div>
                </div>
            )}
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}

            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
                {staff.map((account) => {
                    const isMe = account.id === me.id;
                    return (
                        <li key={account.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold">
                                    {account.name} {isMe && <span className="font-normal text-muted">(you)</span>}
                                </p>
                                <p className="truncate text-xs text-muted">
                                    {account.email} ·{' '}
                                    {account.last_login_at ? `last signed in ${TimeUtility.formatTimeAgo(account.last_login_at)}` : 'never signed in'}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {account.disabled_at && <Badge variant="danger">Deactivated</Badge>}
                                {!account.has_password && <Badge>Invited</Badge>}
                                {account.has_password && !account.has_2fa && <Badge>No two-factor yet</Badge>}
                                <select
                                    aria-label={`Role for ${account.name}`}
                                    value={account.role}
                                    disabled={isMe}
                                    onChange={(e) => void act(() => api(`/admin/staff/${account.id}`, { method: 'PATCH', body: { role: e.target.value } }))}
                                    className={`${selectStyles} h-8 w-auto`}
                                >
                                    {ROLES.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                                {!isMe && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                void act(async () => {
                                                    const result = await api<{ invite_url: string }>(`/admin/staff/${account.id}/invite`, { method: 'POST' });
                                                    setLink({ email: account.email, url: result.invite_url });
                                                })
                                            }
                                        >
                                            {account.has_password ? 'Password link' : 'Resend invite'}
                                        </Button>
                                        {account.has_2fa && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => confirm(`Reset two-factor for ${account.name}? They set it up again at their next sign-in.`) && void act(() => api(`/admin/staff/${account.id}/reset-2fa`, { method: 'POST' }))}
                                            >
                                                Reset 2FA
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => void act(() => api(`/admin/staff/${account.id}`, { method: 'PATCH', body: { disabled: !account.disabled_at } }))}
                                        >
                                            {account.disabled_at ? 'Reactivate' : 'Deactivate'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

const describe = (entry: StaffAuditEntry) => entry.action.replace(/_/g, ' ');

// Audit tab (owner and admins): everything done in the panel, sign-ins included, newest first
export function AuditLog({ initial }: { initial: { entries: StaffAuditEntry[]; next_cursor: string | null } }) {
    const [entries, setEntries] = useState(initial.entries);
    const [cursor, setCursor] = useState(initial.next_cursor);

    async function more() {
        if (!cursor) return;
        const page = await api<{ entries: StaffAuditEntry[]; next_cursor: string | null }>(`/admin/audit?cursor=${encodeURIComponent(cursor)}`);
        setEntries((current) => [...current, ...page.entries]);
        setCursor(page.next_cursor);
    }

    return (
        <div className="flex flex-col gap-3">
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface text-sm">
                {entries.length === 0 && <li className="px-4 py-3 text-muted">Nothing yet.</li>}
                {entries.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 px-4 py-2.5">
                        <span className="font-semibold">{entry.staff?.name ?? 'Setup script'}</span>
                        <span className="first-letter:uppercase">{describe(entry)}</span>
                        {entry.target_type && <span className="text-muted">({entry.target_type})</span>}
                        {entry.details && Object.keys(entry.details).length > 0 && (
                            <span className="min-w-0 truncate font-mono text-xs text-muted">{JSON.stringify(entry.details)}</span>
                        )}
                        <span className="ml-auto text-xs text-subtle" title={entry.ip_address ?? undefined}>
                            {TimeUtility.formatTimeAgo(entry.created_at)}
                        </span>
                    </li>
                ))}
            </ul>
            {cursor && (
                <Button variant="secondary" className="self-center" onClick={() => void more()}>
                    Older
                </Button>
            )}
        </div>
    );
}
