import Link from 'next/link';
import { Bookmark, ChevronRight, CloudOff } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { PostsResponse, SavedCommentsResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import PostCard from '@/components/post/PostCard';
import CommentListItem from '@/components/post/CommentListItem';

export const metadata = { title: `Saved | ${APP_NAME}`, robots: { index: false } };

type PageProps = { searchParams: Promise<{ tab?: string; cursor?: string }> };

export default async function SavedPage({ searchParams }: PageProps) {
    const { tab: tabParam, cursor } = await searchParams;
    const tab = tabParam === 'comments' ? 'comments' : 'posts';
    const query = new URLSearchParams({ type: tab, ...(cursor ? { cursor } : {}) });

    const [posts, comments] = await Promise.all([
        tab === 'posts' ? serverApi<PostsResponse>(`/users/me/saved?${query}`) : null,
        tab === 'comments' ? serverApi<SavedCommentsResponse>(`/users/me/saved?${query}`) : null,
    ]);
    const result = posts ?? comments!;

    if (result.status === 401) {
        return (
            <EmptyState
                icon={<Bookmark />}
                title="Sign in to see what you saved"
                description="Save posts and comments to read later; they'll show up here."
                action={
                    <Button asChild>
                        <Link href="/auth/login?next=/saved">Log in</Link>
                    </Button>
                }
            />
        );
    }

    if (!result.data) {
        return <EmptyState icon={<CloudOff />} title="Couldn't load what you saved" description="Try again in a moment." />;
    }

    const items = posts?.data?.posts ?? comments?.data?.comments ?? [];
    const nextCursor = result.data.next_cursor;

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 py-3 sm:px-4 sm:py-4">
            <h1 className="px-4 text-2xl font-extrabold sm:px-0">Saved</h1>

            <nav aria-label="Saved items" className="flex gap-1 px-4 sm:px-0">
                {(['posts', 'comments'] as const).map((value) => (
                    <Link
                        key={value}
                        href={value === 'posts' ? '/saved' : '/saved?tab=comments'}
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

            {items.length === 0 ? (
                <EmptyState
                    icon={<Bookmark />}
                    title="Nothing saved yet"
                    description={`Tap the ••• menu on any ${tab === 'posts' ? 'post' : 'comment'} and choose Save to keep it here.`}
                />
            ) : (
                <div className="flex flex-col divide-y divide-border sm:gap-3 sm:divide-y-0">
                    {posts?.data
                        ? posts.data.posts.map((post) => <PostCard key={post.id} post={post} />)
                        : comments!.data!.comments.map((comment) => <CommentListItem key={comment.id} comment={comment} />)}
                </div>
            )}

            {nextCursor && (
                <div className="flex justify-center pb-6">
                    <Button asChild variant="secondary">
                        <Link href={`/saved?${new URLSearchParams({ ...(tab === 'comments' ? { tab } : {}), cursor: nextCursor })}`} rel="next">
                            Next page <ChevronRight className="size-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
