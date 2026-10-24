import { Fragment } from 'react';
import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import EmptyState from '@/components/ui/EmptyState';
import { Post, PostSort } from '@/types/api';
import PostCard from './PostCard';
import InfinitePosts from './InfinitePosts';
import FeedAdSlot from '@/ads/FeedAdSlot';
import { slotAfter } from '@/ads/config';
import type { AdUnit } from '@/ads/types';

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
        <nav aria-label="Sort posts" className="mx-4 flex w-fit gap-0.5 rounded-lg bg-surface-muted p-0.5 sm:mx-0">
            {POST_SORTS.map((sort) => (
                <Link
                    key={sort.value}
                    href={sort.value === 'hot' ? basePath : `${basePath}?sort=${sort.value}`}
                    aria-current={current === sort.value ? 'page' : undefined}
                    className={twMerge(
                        'flex h-7 items-center rounded-md px-3 text-[13px] font-bold transition-colors',
                        current === sort.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
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
    // Ads for this page's slots (see ads/config.ts), and where later pages ask for theirs. Leave out for no ads.
    ads?: { units: AdUnit[]; community?: string };
};

export function PostList({ posts, basePath, sort, nextCursor, apiPath, showCommunity = true, empty, ads }: PostListProps) {
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
        // data-list: the split view narrows pages with a list into a column beside an open post (globals.css)
        <div data-list className="flex flex-col">
            <div className={twMerge('flex flex-col divide-y divide-border border-y border-border sm:border-x', nextCursor ? 'sm:rounded-t-xl' : 'sm:rounded-xl')}>
                {posts.map((post, index) => {
                    const slot = ads ? slotAfter(index, 'feed') : null;
                    return (
                        <Fragment key={post.id}>
                            <PostCard post={post} showCommunity={showCommunity} />
                            {slot !== null && <FeedAdSlot unit={ads?.units[slot]} />}
                        </Fragment>
                    );
                })}
            </div>
            {nextCursor && (
                <InfinitePosts
                    apiPath={apiPath}
                    initialCursor={nextCursor}
                    nextHref={`${basePath}?${nextParams}`}
                    seenIds={posts.map((post) => post.id)}
                    showCommunity={showCommunity}
                    ads={ads ? { community: ads.community } : undefined}
                />
            )}
        </div>
    );
}

export default PostList;
