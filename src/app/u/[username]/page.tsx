import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, CloudOff, MessageCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { PostsResponse, PublicUserResponse, UserCommentsResponse } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import PostCard from '@/components/post/PostCard';
import CommentListItem from '@/components/post/CommentListItem';
import NumberUtility from '@/lib/utils/NumberUtility';
import JsonLd from '@/components/common/JsonLd';
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
    const name = user.display_name ? `${user.display_name} (u/${user.username})` : `u/${user.username}`;
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

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 sm:px-4 sm:py-4">
            <JsonLd data={profileJsonLd(user)} />
            <header className="flex items-center gap-4 border-b border-border bg-surface px-4 py-5 sm:rounded-xl sm:border">
                <Avatar name={user.username} size="xl" />
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-extrabold">{user.display_name ?? `u/${user.username}`}</h1>
                    <p className="text-sm text-muted">
                        {user.display_name && <span>u/{user.username} • </span>}
                        <span className="tabular-nums">{NumberUtility.compactFormatter.format(user.karma)}</span> karma • Joined{' '}
                        {JOINED_FORMAT.format(new Date(user.created_at))}
                    </p>
                    {user.is_suspended && (
                        <Badge variant="danger" className="mt-1">
                            Suspended
                        </Badge>
                    )}
                </div>
            </header>

            <nav aria-label="Profile sections" className="flex gap-1 px-4 sm:px-0">
                {(['posts', 'comments'] as const).map((value) => (
                    <Link
                        key={value}
                        href={value === 'posts' ? basePath : `${basePath}?tab=comments`}
                        aria-current={tab === value ? 'page' : undefined}
                        className={twMerge(
                            'flex h-8 items-center rounded-full px-3 text-sm font-semibold capitalize transition-colors',
                            tab === value ? 'bg-highlight text-highlight-fg' : 'text-muted hover:bg-surface-muted hover:text-text'
                        )}
                    >
                        {value}
                    </Link>
                ))}
            </nav>

            {!items ? (
                <EmptyState title="Couldn't load this list" description="Try again in a moment." />
            ) : items.length === 0 ? (
                <EmptyState
                    icon={<MessageCircle />}
                    title={tab === 'posts' ? 'No posts yet' : 'No comments yet'}
                    description="Anonymous posts and comments never show on a profile."
                />
            ) : (
                <div className="flex flex-col divide-y divide-border sm:gap-3 sm:divide-y-0">
                    {tab === 'posts'
                        ? posts!.data!.posts.map((post) => <PostCard key={post.id} post={post} />)
                        : comments!.data!.comments.map((comment) => <CommentListItem key={comment.id} comment={comment} />)}
                </div>
            )}

            {nextCursor && (
                <div className="flex justify-center pb-6">
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
    );
}
