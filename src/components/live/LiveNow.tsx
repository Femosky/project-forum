import Link from 'next/link';
import { twMerge } from 'tailwind-merge';
import { serverApi } from '@/lib/api/server';
import { Post, PostsResponse } from '@/types/api';
import { getPostPath } from '@/components/post/PostCard';
import { LiveDot } from '@/components/post/LiveBadge';
import { communityLabel } from '@/lib/communityName';
import NumberUtility from '@/lib/utils/NumberUtility';

// Live threads for the home page, busiest first (the API ranks them)
export async function loadLiveNow(): Promise<Post[]> {
    const { data } = await serverApi<PostsResponse>('/feed/live');
    return data?.posts ?? [];
}

// "Live now": live threads (match days, events) as plain links, rendered with the page, so it costs no JavaScript
// and shifts nothing. In the right rail on wide screens; at the top of the feed on smaller ones (the rail is hidden
// there). Shows nothing when nothing is live.
function LiveRow({ post, compact }: { post: Post; compact: boolean }) {
    return (
        <Link href={getPostPath(post)} className={twMerge('group flex flex-col gap-0.5', compact ? 'py-1.5' : 'h-full justify-center py-2.5')}>
            <span className={twMerge('line-clamp-2 font-medium text-text group-hover:underline', compact ? 'text-sm' : 'text-[15px] leading-[21px]')}>
                {post.title}
            </span>
            <span className="text-xs text-subtle">
                {communityLabel(post.community)} · {NumberUtility.compactFormatter.format(post.comment_count)}{' '}
                {post.comment_count === 1 ? 'reply' : 'replies'}
            </span>
        </Link>
    );
}

// Rows per page in the feed version, so a phone shows a normal post without scrolling far
const PER_PAGE = 2;

// "Live now": live threads (match days, events) as plain links, rendered with the page, so it costs no JavaScript
// and shifts nothing. In the right rail on wide screens; at the top of the feed on smaller ones (the rail is hidden
// there), two at a time with the rest a sideways swipe away (CSS scroll snap, the next page peeking in). Shows
// nothing when nothing is live.
export function LiveNow({ posts, variant, className }: { posts: Post[]; variant: 'rail' | 'feed'; className?: string }) {
    if (posts.length === 0) return null;
    const id = `live-now-${variant}`;

    if (variant === 'rail') {
        return (
            <section aria-labelledby={id} className={twMerge('flex flex-col gap-1 pt-4', className)}>
                <h2 id={id} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.04em] text-brand-text">
                    <LiveDot /> Live now
                </h2>
                <ul className="flex flex-col gap-0.5">
                    {posts.map((post) => (
                        <li key={post.id}>
                            <LiveRow post={post} compact />
                        </li>
                    ))}
                </ul>
            </section>
        );
    }

    const pages: Post[][] = [];
    for (let i = 0; i < posts.length; i += PER_PAGE) pages.push(posts.slice(i, i + PER_PAGE));
    const paged = pages.length > 1;

    return (
        <section aria-labelledby={id} className={twMerge('mt-4 flex flex-col gap-1', className)}>
            <h2 id={id} className="mx-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.04em] text-brand-text sm:mx-0">
                <LiveDot /> Live now
                {paged && <span className="font-medium normal-case tracking-normal text-subtle">· {posts.length} threads, swipe for more</span>}
            </h2>
            <ul className="flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                {pages.map((page, index) => (
                    <li
                        key={page[0].id}
                        aria-label={paged ? `${index + 1} of ${pages.length}` : undefined}
                        className={twMerge(
                            // Two equal rows on every page, so the line between them sits in the same place on each slide
                            // (titles hold up to two lines; every page is as tall as the tallest)
                            'grid shrink-0 snap-start grid-rows-2 divide-y divide-border rounded-[12px] px-4 py-1 ring-1 ring-inset ring-border',
                            paged ? 'w-[86%]' : 'w-full'
                        )}
                    >
                        {page.map((post) => (
                            <LiveRow key={post.id} post={post} compact={false} />
                        ))}
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default LiveNow;
