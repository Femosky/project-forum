import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, CloudOff, Lock, MessageCircle, Pencil } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { APP_NAME, REPUTATION_LABEL } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { PostsResponse, PublicUserResponse, UserCommentsResponse, UserResponse, UserStatsResponse } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import PostCard from '@/components/post/PostCard';
import CommentListItem from '@/components/post/CommentListItem';
import ReportUserButton from '@/components/post/ReportUserButton';
import NumberUtility from '@/lib/utils/NumberUtility';
import JsonLd from '@/components/common/JsonLd';
import PageBar from '@/components/layout/PageBar';
import { noindexMetadata, pageMetadata, profileJsonLd } from '@/lib/seo';

type PageProps = {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ tab?: string; cursor?: string }>;
};

const JOINED_FORMAT = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
    const { username } = await params;
    const { tab, cursor } = await searchParams;
    const { data } = await serverApi<PublicUserResponse>(`/users/${encodeURIComponent(username)}`);
    if (!data) return noindexMetadata(`User not found | ${APP_NAME}`);

    const { user } = data;
    const name = user.display_name ? `${user.display_name} (u/${user.username})` : `@${user.username}`;
    return pageMetadata({
        title: `${name} | ${APP_NAME}`,
        description: `Posts and comments by u/${user.username} on ${APP_NAME}. Joined ${JOINED_FORMAT.format(new Date(user.created_at))}.`,
        path: `/u/${user.username}`,
        image: `/og/u/${user.username}`,
        noindex: user.is_suspended || Boolean(tab || cursor),
        openGraph: { type: 'profile', username: user.username },
    });
}

export default async function ProfilePage({ params, searchParams }: PageProps) {
    const { username } = await params;
    const { tab: tabParam, cursor } = await searchParams;
    const tab = tabParam === 'comments' ? 'comments' : 'posts';
    const basePath = `/u/${username}`;
    const page = new URLSearchParams(cursor ? { cursor } : {});

    const [profile, posts, comments] = await Promise.all([
        serverApi<PublicUserResponse>(`/users/${encodeURIComponent(username)}`),
        tab === 'posts' ? serverApi<PostsResponse>(`/users/${encodeURIComponent(username)}/posts?${page}`) : null,
        tab === 'comments' ? serverApi<UserCommentsResponse>(`/users/${encodeURIComponent(username)}/comments?${page}`) : null,
    ]);

    if (profile.status === 404) notFound();
    if (!profile.data) {
        return <EmptyState icon={<CloudOff />} title="Couldn't load this profile" description="Try again in a moment." />;
    }

    const { user } = profile.data;
    const nextCursor = tab === 'posts' ? posts?.data?.next_cursor : comments?.data?.next_cursor;
    const items = tab === 'posts' ? posts?.data?.posts : comments?.data?.comments;

    // Your own profile adds an Edit profile button and private numbers (views only you can see)
    const me = await serverApi<UserResponse>('/auth/me');
    const isMe = me.data?.user.id === user.id;
    const stats = isMe ? (await serverApi<UserStatsResponse>('/users/me/stats')).data?.stats : null;
    const statItems = stats
        ? [
              { label: REPUTATION_LABEL, value: user.karma },
              { label: 'posts', value: stats.posts },
              { label: 'replies', value: stats.comments },
              { label: 'likes received', value: stats.upvotes_received },
              { label: 'dislikes received', value: stats.downvotes_received },
              { label: 'views', value: stats.views, private: true },
          ]
        : null;

    return (
        <>
            <PageBar title={`@${user.username}`} />
            <div className="mx-auto flex w-full max-w-[45rem] flex-col sm:px-5">
                <JsonLd data={profileJsonLd(user)} />
                <header className="flex flex-col gap-5 border-b border-border px-4 pb-6 pt-7 sm:px-0">
                    <div className="flex items-center gap-4">
                        <Avatar name={user.username} size="xl" className="size-14 text-lg" />
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-[22px] font-semibold leading-7 tracking-[-0.015em]">{user.display_name ?? `@${user.username}`}</h1>
                            <p className="mt-0.5 text-[13.5px] text-subtle">
                                {user.display_name && <span>@{user.username} · </span>}
                                {!isMe && (
                                    <>
                                        <span className="tabular-nums">{NumberUtility.compactFormatter.format(user.karma)}</span> {REPUTATION_LABEL} ·{' '}
                                    </>
                                )}
                                Joined {JOINED_FORMAT.format(new Date(user.created_at))}
                            </p>
                            {user.is_suspended && (
                                <Badge variant="danger" className="mt-1">
                                    Suspended
                                </Badge>
                            )}
                        </div>
                        {isMe ? (
                            <Button asChild variant="secondary" size="sm">
                                <Link href="/settings">
                                    <Pencil className="size-3.5" /> Edit profile
                                </Link>
                            </Button>
                        ) : (
                            <ReportUserButton userId={user.id} username={user.username} />
                        )}
                    </div>

                    {statItems && (
                        <dl className="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-6">
                            {statItems.map((item) => (
                                <div key={item.label} className="flex flex-col">
                                    <dt className="order-2 flex items-center gap-1 text-xs text-subtle first-letter:uppercase">
                                        {item.label}
                                        {item.private && <Lock className="size-3" aria-label="Only you can see this" />}
                                    </dt>
                                    <dd className="text-lg font-semibold tabular-nums">{NumberUtility.compactFormatter.format(item.value)}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </header>

                <nav aria-label="Profile sections" className="flex gap-0.5 px-4 pt-3 sm:px-0">
                    {(['posts', 'comments'] as const).map((value) => (
                        <Link
                            key={value}
                            href={value === 'posts' ? basePath : `${basePath}?tab=comments`}
                            aria-current={tab === value ? 'page' : undefined}
                            className={twMerge(
                                'flex h-7 items-center rounded-md px-2.5 text-[13px] font-semibold transition-colors',
                                tab === value ? 'bg-active text-text' : 'text-muted hover:text-text'
                            )}
                        >
                            {value === 'posts' ? 'Posts' : 'Replies'}
                        </Link>
                    ))}
                </nav>

                {!items ? (
                    <EmptyState title="Couldn't load this list" description="Try again in a moment." />
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={<MessageCircle />}
                        title={tab === 'posts' ? 'No posts yet' : 'No replies yet'}
                        description="Anonymous posts and replies never show on a profile."
                    />
                ) : (
                    <div className="flex flex-col divide-y divide-border">
                        {tab === 'posts'
                            ? posts!.data!.posts.map((post) => <PostCard key={post.id} post={post} />)
                            : comments!.data!.comments.map((comment) => <CommentListItem key={comment.id} comment={comment} />)}
                    </div>
                )}

                {nextCursor && (
                    <div className="flex justify-center py-6">
                        <Button asChild variant="secondary">
                            <Link
                                href={`${basePath}?${new URLSearchParams({ ...(tab === 'comments' ? { tab } : {}), cursor: nextCursor })}`}
                                rel="next"
                            >
                                Next page <ChevronRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
