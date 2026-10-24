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
        <section aria-label={title} className="flex flex-col gap-1">
            <h2 className="px-4 text-sm font-bold text-muted sm:px-0">{title}</h2>
            <ul className="flex flex-col divide-y divide-border bg-surface sm:rounded-xl sm:border sm:border-border">
                {posts.map((post) => (
                    <li key={post.short_id}>
                        <Link
                            href={`/c/${post.community}/${post.short_id}${post.slug ? `/${post.slug}` : ''}`}
                            className="flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-surface-muted/60"
                        >
                            <span className="line-clamp-2 font-semibold">{post.title}</span>
                            <span className="text-xs text-muted">
                                {showCommunity && <>{post.community} • </>}
                                <span className="tabular-nums">{NumberUtility.compactFormatter.format(post.score)}</span> points •{' '}
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
        <div className="flex flex-col gap-4 pb-6 pt-2 sm:px-4">
            <ThreadList title="Related threads" posts={related} showCommunity />
            <ThreadList title={`More from c/${community}`} posts={more_from_community} showCommunity={false} />
        </div>
    );
}

export default RelatedThreads;
