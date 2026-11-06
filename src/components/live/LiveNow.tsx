import Link from 'next/link';
import { serverApi } from '@/lib/api/server';
import { PostsResponse } from '@/types/api';
import { getPostPath } from '@/components/post/PostCard';
import { LiveDot } from '@/components/post/LiveBadge';
import { communityLabel } from '@/lib/communityName';
import NumberUtility from '@/lib/utils/NumberUtility';

// "Live now" at the top of the home page: live threads (match days, events) as plain links, rendered with the
// page, so it costs no JavaScript and shifts nothing. Shows nothing when nothing is live.
export async function LiveNow() {
    const { data } = await serverApi<PostsResponse>('/feed/live');
    const posts = data?.posts ?? [];
    if (posts.length === 0) return null;

    return (
        <section aria-labelledby="live-now" className="mx-4 mt-4 rounded-[12px] px-4 py-3 ring-1 ring-inset ring-border sm:mx-0">
            <h2 id="live-now" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.04em] text-brand-text">
                <LiveDot /> Live now
            </h2>
            <ul className="mt-1 flex flex-col divide-y divide-border">
                {posts.map((post) => (
                    <li key={post.id}>
                        <Link href={getPostPath(post)} className="group flex flex-col gap-0.5 py-2.5">
                            <span className="line-clamp-2 text-[15px] font-medium leading-[21px] text-text group-hover:underline">{post.title}</span>
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
