import Link from 'next/link';
import { RelatedPost } from '@/types/api';
import NumberUtility from '@/lib/utils/NumberUtility';

type RelatedThreadsProps = {
    community: string;
    related: RelatedPost[];
    more_from_community: RelatedPost[];
};

function ThreadList({ title, posts, showCommunity }: { title: string; posts: RelatedPost[]; showCommunity: boolean }) {
    if (posts.length === 0) return null;
    return (
        <section aria-label={title} className="flex flex-col">
            <h2 className="px-4 pb-1 text-xs font-semibold uppercase tracking-[0.04em] text-subtle sm:px-0">{title}</h2>
            <ul className="flex flex-col divide-y divide-border">
                {posts.map((post) => (
                    <li key={post.short_id}>
                        <Link
                            href={`/c/${post.community}/${post.short_id}${post.slug ? `/${post.slug}` : ''}`}
                            className="flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-hover sm:-mx-3 sm:rounded-[10px] sm:px-3"
                        >
                            <span className="line-clamp-2 text-[14.5px] font-medium leading-[21px]">{post.title}</span>
                            <span className="text-[12.5px] text-subtle">
                                {showCommunity && <>{post.community} · </>}
                                <span className="tabular-nums">{NumberUtility.compactFormatter.format(post.score)}</span> points ·{' '}
                                <span className="tabular-nums">{NumberUtility.compactFormatter.format(post.comment_count)}</span>{' '}
                                {post.comment_count === 1 ? 'comment' : 'comments'}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// Plain links under a thread: keeps readers on the site and spreads crawlers across it
export function RelatedThreads({ community, related, more_from_community }: RelatedThreadsProps) {
    if (related.length === 0 && more_from_community.length === 0) return null;
    return (
        <div className="flex flex-col gap-6 border-t border-border pb-10 pt-6">
            <ThreadList title="Related threads" posts={related} showCommunity />
            <ThreadList title={`More from ${community}`} posts={more_from_community} showCommunity={false} />
        </div>
    );
}

export default RelatedThreads;
