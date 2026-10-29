import Link from 'next/link';
import { Flame } from 'lucide-react';
import { serverApi } from '@/lib/api/server';
import { TrendingPostsResponse, TrendingTopicsResponse } from '@/types/api';
import { getPostPath } from '@/components/post/PostCard';
import { communityLabel } from '@/lib/communityName';
import NumberUtility from '@/lib/utils/NumberUtility';
import { TrendingTopics } from './TrendingTopics';

// "Trending now" for the home page's right rail (wide screens): a few topics and the top threads, as plain links
// rendered with the page, so it costs no JavaScript and shifts nothing. Shows nothing when nothing is trending.
export async function TrendingNow() {
    const [topics, posts] = await Promise.all([
        serverApi<TrendingTopicsResponse>('/trending?type=topics&limit=8'),
        serverApi<TrendingPostsResponse>('/trending?type=posts&limit=5'),
    ]);
    const topicList = topics.data?.topics ?? [];
    const postList = posts.data?.posts ?? [];
    if (topicList.length === 0 && postList.length === 0) return null;

    return (
        <aside aria-labelledby="trending-now" className="flex flex-col gap-3 py-4">
            <h2 id="trending-now" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-subtle">
                <Flame className="size-4 text-brand" /> Trending now
            </h2>
            <TrendingTopics topics={topicList} />
            {postList.length > 0 && (
                <ol className="flex flex-col gap-3">
                    {postList.map((post) => (
                        <li key={post.id}>
                            <Link href={getPostPath(post)} className="group flex flex-col gap-0.5">
                                <span className="line-clamp-2 text-sm font-medium text-text group-hover:underline">{post.title}</span>
                                <span className="text-xs text-subtle">
                                    {communityLabel(post.community)} · {NumberUtility.compactFormatter.format(post.comment_count)}{' '}
                                    {post.comment_count === 1 ? 'reply' : 'replies'}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ol>
            )}
            <Link href="/trending" className="text-[13px] font-semibold text-link hover:underline">
                See what&apos;s trending
            </Link>
        </aside>
    );
}

export default TrendingNow;
