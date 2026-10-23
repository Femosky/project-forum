import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import EmptyState from '@/components/ui/EmptyState';
import { Post, PostSort } from '@/types/api';
import PostCard from './PostCard';
import InfinitePosts from './InfinitePosts';

export const POST_SORTS: { value: PostSort; label: string }[] = [
    { value: 'hot', label: 'Hot' },
    { value: 'new', label: 'New' },
    { value: 'top', label: 'Top' },
];

export function parsePostSort(value: string | string[] | undefined): PostSort {
    return POST_SORTS.some((sort) => sort.value === value) ? (value as PostSort) : 'hot';
}

// Plain links, so sorting works without JavaScript and crawlers can follow them
export function SortTabs({ basePath, current }: { basePath: string; current: PostSort }) {
    return (
        <nav aria-label="Sort posts" className="flex gap-1 px-4 sm:px-0">
            {POST_SORTS.map((sort) => (
                <Link
                    key={sort.value}
                    href={sort.value === 'hot' ? basePath : `${basePath}?sort=${sort.value}`}
                    aria-current={current === sort.value ? 'page' : undefined}
                    className={twMerge(
                        'flex h-8 items-center rounded-full px-3 text-sm font-semibold transition-colors',
                        current === sort.value ? 'bg-highlight text-highlight-fg' : 'text-muted hover:bg-surface-muted hover:text-text'
                    )}
                >
                    {sort.label}
                </Link>
            ))}
        </nav>
    );
}

type PostListProps = {
    posts: Post[];
    basePath: string;
    sort: PostSort;
    nextCursor: string | null;
    // The same list on the API, without a cursor, for loading further pages in the browser
    apiPath: string;
    showCommunity?: boolean;
    empty?: { title: string; description: string; action?: React.ReactNode };
};

export function PostList({ posts, basePath, sort, nextCursor, apiPath, showCommunity = true, empty }: PostListProps) {
    if (posts.length === 0) {
        return (
            <EmptyState
                icon={<MessagesSquare />}
                title={empty?.title ?? 'No posts yet'}
                description={empty?.description ?? 'Be the first to start a conversation.'}
                action={empty?.action}
            />
        );
    }

    const nextParams = new URLSearchParams({ ...(sort === 'hot' ? {} : { sort }), cursor: nextCursor ?? '' });

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col divide-y divide-border sm:gap-3 sm:divide-y-0">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} showCommunity={showCommunity} />
                ))}
            </div>
            {nextCursor && (
                <InfinitePosts
                    apiPath={apiPath}
                    initialCursor={nextCursor}
                    nextHref={`${basePath}?${nextParams}`}
                    seenIds={posts.map((post) => post.id)}
                    showCommunity={showCommunity}
                />
            )}
        </div>
    );
}

export default PostList;
