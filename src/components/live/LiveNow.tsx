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
export function LiveNow({ posts, variant, className }: { posts: Post[]; variant: 'rail' | 'feed'; className?: string }) {
    if (posts.length === 0) return null;
    const id = `live-now-${variant}`;
    const isRail = variant === 'rail';

    return (
        <section
            aria-labelledby={id}
            className={twMerge(isRail ? 'flex flex-col gap-1 pt-4' : 'mx-4 mt-4 rounded-[12px] px-4 py-3 ring-1 ring-inset ring-border sm:mx-0', className)}
        >
            <h2 id={id} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.04em] text-brand-text">
                <LiveDot /> Live now
            </h2>
            <ul className={twMerge('flex flex-col', isRail ? 'gap-0.5' : 'mt-1 divide-y divide-border')}>
                {posts.map((post) => (
                    <li key={post.id}>
                        <Link href={getPostPath(post)} className={twMerge('group flex flex-col gap-0.5', isRail ? 'py-1.5' : 'py-2.5')}>
                            <span className={twMerge('line-clamp-2 font-medium text-text group-hover:underline', isRail ? 'text-sm' : 'text-[15px] leading-[21px]')}>
                                {post.title}
                            </span>
                            <span className="text-xs text-subtle">
                                {communityLabel(post.community)} · {NumberUtility.compactFormatter.format(post.comment_count)}{' '}
                                {post.comment_count === 1 ? 'reply' : 'replies'}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default LiveNow;
