import Link from 'next/link';
import { AtSign, Bell, ChevronRight, CloudOff, MessageCircle, Reply } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { AppNotification, NotificationsResponse } from '@/types/api';
import { stripMarkdown } from '@/components/common/Markdown';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import TimeUtility from '@/lib/utils/TimeUtility';
import MarkAllRead from './_components/MarkAllRead';
import { humanizeHandle } from '@/lib/communityName';

export const metadata = { title: `Notifications | ${APP_NAME}`, robots: { index: false } };

type PageProps = { searchParams: Promise<{ cursor?: string }> };

const ICONS = { post_reply: MessageCircle, comment_reply: Reply, mention: AtSign } as const;

function describe(notification: AppNotification): string {
    const who = notification.actor?.username ?? 'Someone';
    if (notification.type === 'post_reply') return `${who} commented on your post`;
    if (notification.type === 'comment_reply') return `${who} replied to your comment`;
    return `${who} mentioned you`;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
    const { cursor } = await searchParams;
    const { data, status } = await serverApi<NotificationsResponse>(`/notifications${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);

    if (status === 401) {
        return (
            <EmptyState
                icon={<Bell />}
                title="Sign in to see notifications"
                description="You'll hear about replies to your posts and comments, and when someone mentions you."
                action={
                    <Button asChild>
                        <Link href="/auth/login?next=/notifications">Log in</Link>
                    </Button>
                }
            />
        );
    }

    if (!data) {
        return <EmptyState icon={<CloudOff />} title="Couldn't load notifications" description="Try again in a moment." />;
    }

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 py-3 sm:px-4 sm:py-4">
            <h1 className="px-4 text-2xl font-extrabold sm:px-0">Notifications</h1>
            {/* Opening the page counts as reading them; the highlight below shows what was new on arrival */}
            {data.unread_count > 0 && <MarkAllRead />}

            {data.notifications.length === 0 ? (
                <EmptyState
                    icon={<Bell />}
                    title="Nothing yet"
                    description="Replies to your posts and comments, and mentions like @yourname, will show up here."
                />
            ) : (
                <ul className="flex flex-col divide-y divide-border bg-surface sm:rounded-xl sm:border sm:border-border">
                    {data.notifications.map((notification) => {
                        const Icon = ICONS[notification.type];
                        const { post } = notification;
                        const short = notification.comment.short_id;
                        const href = `/c/${post.community}/${post.short_id}${post.slug ? `/${post.slug}` : ''}?comment=${short}#c-${short}`;
                        const isUnread = notification.read_at === null;
                        return (
                            <li key={notification.id}>
                                <Link
                                    href={href}
                                    className={twMerge(
                                        'flex gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60',
                                        isUnread && 'bg-highlight/30'
                                    )}
                                >
                                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted">
                                        <Icon className="size-4" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm">
                                            <span className="font-bold">{describe(notification)}</span>
                                            <span className="text-muted"> in {humanizeHandle(post.community)}</span>
                                        </p>
                                        <p className="truncate text-xs text-muted">{post.title}</p>
                                        <p className="mt-1 line-clamp-2 text-sm">{stripMarkdown(notification.comment.excerpt)}</p>
                                        <time dateTime={notification.created_at} className="text-xs text-muted">
                                            {TimeUtility.formatTimeAgo(notification.created_at)}
                                        </time>
                                    </div>
                                    {isUnread && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="New" />}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}

            {data.next_cursor && (
                <div className="flex justify-center pb-6">
                    <Button asChild variant="secondary">
                        <Link href={`/notifications?cursor=${encodeURIComponent(data.next_cursor)}`} rel="next">
                            Older <ChevronRight className="size-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
