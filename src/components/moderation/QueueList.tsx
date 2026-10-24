'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleCheck, EyeOff, Flag, Gavel, Inbox, MessageSquare, ShieldAlert, ShieldX, UserX, VolumeX } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Markdown from '@/components/common/Markdown';
import { getPostPath } from '@/components/post/PostCard';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { reasonLabel } from '@/lib/moderation';
import TimeUtility from '@/lib/utils/TimeUtility';
import { QueueItem, ReportReason } from '@/types/api';
import ActionDialog, { ActionInput } from './ActionDialog';

type Pending = { title: string; description?: string; confirmLabel: string; withDuration?: boolean; allowPermanent?: boolean; destructive?: boolean; run: (input: ActionInput) => Promise<void> };

// The mod queue: reported and held items with the actions that settle them. `site` adds the admin-only actions
// (suspend, shadow-ban, takedown) used on the admin panel.
export function QueueList({ initialItems, site = false }: { initialItems: QueueItem[]; site?: boolean }) {
    const [items, setItems] = useState(initialItems);
    const [pending, setPending] = useState<Pending | null>(null);
    const [error, setError] = useState<string | null>(null);

    const done = (item: QueueItem) => setItems((current) => current.filter((other) => other !== item));

    async function run(item: QueueItem, action: () => Promise<unknown>) {
        setError(null);
        try {
            await action();
            done(item);
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    const dismiss = (item: QueueItem) =>
        run(item, async () => {
            // Closing one report closes every open report on the same target
            if (item.report_ids[0]) await api(`/reports/${item.report_ids[0]}/resolve`, { method: 'POST', body: { status: 'dismissed' } });
        });

    const moderate = (item: QueueItem, action: 'approve' | 'remove', reason?: string) =>
        api(`/${item.target_type}s/${item.target_id}/moderation`, { method: 'POST', body: { action, reason } });

    function askRemove(item: QueueItem) {
        setPending({
            title: `Remove this ${item.target_type}?`,
            description: 'It disappears for everyone and its reports are closed.',
            confirmLabel: 'Remove',
            run: async ({ reason }) => {
                await moderate(item, 'remove', reason);
                done(item);
            },
        });
    }

    function askRestrict(item: QueueItem, kind: 'ban' | 'mute', community: string, username: string) {
        setPending({
            title: `${kind === 'ban' ? 'Ban' : 'Mute'} u/${username} in c/${community}?`,
            description:
                kind === 'ban'
                    ? "They won't be able to post, comment, vote or rejoin. The item stays in the queue."
                    : 'They can still read but not post or comment. The item stays in the queue.',
            confirmLabel: kind === 'ban' ? 'Ban' : 'Mute',
            withDuration: true,
            allowPermanent: kind === 'ban',
            run: async ({ reason, days }) => {
                await api(`/communities/${community}/${kind === 'ban' ? 'bans' : 'mutes'}`, { method: 'POST', body: { username, reason, days } });
            },
        });
    }

    function askSuspend(item: QueueItem, username: string) {
        setPending({
            title: `Suspend u/${username}?`,
            description: 'Signs them out everywhere and stops them signing in until the suspension ends.',
            confirmLabel: 'Suspend',
            withDuration: true,
            run: async ({ reason, days }) => {
                await api(`/admin/users/${username}/suspend`, { method: 'POST', body: { reason, days } });
                if (item.target_type === 'user') await dismiss(item);
            },
        });
    }

    function askShadowBan(item: QueueItem, username: string) {
        setPending({
            title: `Shadow-ban u/${username}?`,
            description: 'Everything they have written and will write is hidden from everyone but them. Use it for spam accounts.',
            confirmLabel: 'Shadow-ban',
            run: async ({ reason }) => {
                await api(`/admin/users/${username}/shadow-ban`, { method: 'POST', body: { shadow_banned: true, reason } });
                if (item.target_type === 'user') await dismiss(item);
            },
        });
    }

    function askTakedown(item: QueueItem, name: string) {
        setPending({
            title: `Take down c/${name}?`,
            description: 'The community and its posts disappear for everyone. An admin can restore it later.',
            confirmLabel: 'Take down',
            run: async ({ reason }) => {
                await api(`/admin/communities/${name}/takedown`, { method: 'POST', body: { reason } });
                await dismiss(item);
            },
        });
    }

    if (items.length === 0) {
        return <EmptyState icon={<Inbox />} title="All clear" description="Nothing is waiting for review." />;
    }

    return (
        <div className="flex flex-col gap-3">
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            <ul className="flex flex-col gap-3">
                {items.map((item) => {
                    const community = item.post?.community.name ?? item.comment?.post.community;
                    const author = item.post?.author?.username ?? item.comment?.author?.username ?? item.user?.username;
                    const status = item.post?.status ?? item.comment?.status;
                    return (
                        <li key={`${item.target_type}:${item.target_id}`} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
                            <QueueSummary item={item} />
                            <QueueTarget item={item} />
                            <div className="flex flex-wrap gap-2">
                                {(item.post || item.comment) && (
                                    <>
                                        {status !== 'removed' && (
                                            <Button size="sm" variant="danger" onClick={() => askRemove(item)}>
                                                <ShieldX className="size-4" /> Remove
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => run(item, () => (status === 'pending' || status === 'removed' ? moderate(item, 'approve') : dismiss(item)))}
                                        >
                                            <CircleCheck className="size-4" /> {status === 'pending' ? 'Approve' : status === 'removed' ? 'Restore' : 'Keep'}
                                        </Button>
                                        {community && author && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => askRestrict(item, 'mute', community, author)}>
                                                    <VolumeX className="size-4" /> Mute author
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => askRestrict(item, 'ban', community, author)}>
                                                    <Gavel className="size-4" /> Ban author
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}
                                {site && author && (
                                    <>
                                        <Button size="sm" variant="outline" onClick={() => askSuspend(item, author)}>
                                            <UserX className="size-4" /> Suspend account
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => askShadowBan(item, author)}>
                                            <EyeOff className="size-4" /> Shadow-ban
                                        </Button>
                                    </>
                                )}
                                {site && item.community && (
                                    <Button size="sm" variant="danger" onClick={() => askTakedown(item, item.community!.name)}>
                                        <ShieldX className="size-4" /> Take down
                                    </Button>
                                )}
                                {site && item.ad && (
                                    <>
                                        {item.ad.is_active && (
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => run(item, () => api(`/admin/ads/creatives/${item.target_id}`, { method: 'PATCH', body: { is_active: false } }))}
                                            >
                                                <ShieldX className="size-4" /> Pause ad
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/admin?tab=ads&campaign=${item.ad.campaign_id}`}>Open campaign</Link>
                                        </Button>
                                    </>
                                )}
                                {(item.user || item.community || item.ad) && (
                                    <Button size="sm" variant="secondary" onClick={() => dismiss(item)}>
                                        <CircleCheck className="size-4" /> Dismiss reports
                                    </Button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {pending && (
                <ActionDialog
                    open
                    onOpenChange={(open) => !open && setPending(null)}
                    title={pending.title}
                    description={pending.description}
                    confirmLabel={pending.confirmLabel}
                    withDuration={pending.withDuration}
                    allowPermanent={pending.allowPermanent}
                    destructive={pending.destructive}
                    onConfirm={pending.run}
                />
            )}
        </div>
    );
}

function QueueSummary({ item }: { item: QueueItem }) {
    const reasons = Object.entries(item.reports.reasons) as [ReportReason, number][];
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {item.held_reason && (
                    <Badge variant="highlight">
                        <ShieldAlert className="size-3.5" /> Held: {item.held_reason}
                    </Badge>
                )}
                {item.reports.total > 0 && (
                    <Badge variant="danger">
                        <Flag className="size-3.5" /> {item.reports.total} {item.reports.total === 1 ? 'report' : 'reports'}
                    </Badge>
                )}
                {reasons.map(([reason, count]) => (
                    <Badge key={reason}>
                        {reasonLabel(reason)}
                        {count > 1 ? ` ×${count}` : ''}
                    </Badge>
                ))}
                <span className="text-muted" suppressHydrationWarning>
                    {TimeUtility.formatTimeAgo(item.updated_at)}
                </span>
            </div>
            {item.reports.notes.map((note) => (
                <p key={`${note.reporter}-${note.created_at}`} className="rounded-lg bg-surface-muted px-3 py-2 text-sm">
                    &ldquo;{note.note}&rdquo; <span className="text-muted">from @{note.reporter}</span>
                </p>
            ))}
        </div>
    );
}

function QueueTarget({ item }: { item: QueueItem }) {
    if (item.post) {
        const { post } = item;
        return (
            <div className="flex flex-col gap-1">
                <p className="text-xs text-muted">
                    Post in {post.community.name} by {post.author ? `@${post.author.username}` : '[deleted]'}
                    {post.is_anonymous && ' (posted anonymously)'}
                </p>
                <Link href={getPostPath(post)} className="font-bold hover:underline" target="_blank">
                    {post.title}
                </Link>
                {post.url && <p className="truncate text-sm text-link">{post.url}</p>}
                {post.body && <Markdown text={post.body} className="line-clamp-6 text-sm" />}
            </div>
        );
    }
    if (item.comment) {
        const { comment } = item;
        return (
            <div className="flex flex-col gap-1">
                <p className="flex items-center gap-1 text-xs text-muted">
                    <MessageSquare className="size-3.5" /> Comment by {comment.author ? `@${comment.author.username}` : '[deleted]'}
                    {comment.is_anonymous && ' (posted anonymously)'} on{' '}
                    <Link
                        href={`/c/${comment.post.community}/${comment.post.short_id}/${comment.post.slug}?comment=${comment.short_id}`}
                        className="font-semibold text-link hover:underline"
                        target="_blank"
                    >
                        {comment.post.title}
                    </Link>
                </p>
                <Markdown text={comment.body} className="line-clamp-6 text-sm" />
            </div>
        );
    }
    if (item.user) {
        return (
            <p className="text-sm">
                Account{' '}
                <Link href={`/u/${item.user.username}`} className="font-bold hover:underline" target="_blank">
                    @{item.user.username}
                </Link>{' '}
                <span className="text-muted">
                    · {item.user.karma} karma · joined <span suppressHydrationWarning>{TimeUtility.formatTimeAgo(item.user.created_at)}</span> · {item.user.status}
                </span>
            </p>
        );
    }
    if (item.ad) {
        return (
            <p className="text-sm">
                Ad <span className="font-bold">{item.ad.headline}</span>{' '}
                <span className="text-muted">
                    · {item.ad.advertiser} · {item.ad.campaign}
                    {!item.ad.is_active && ' · paused'}
                </span>
            </p>
        );
    }
    if (item.community) {
        return (
            <p className="text-sm">
                Community{' '}
                <Link href={`/c/${item.community.name}`} className="font-bold hover:underline" target="_blank">
                    {item.community.name}
                </Link>{' '}
                <span className="text-muted">· {item.community.status}</span>
            </p>
        );
    }
    return null;
}

export default QueueList;
