import Link from 'next/link';
import { ExternalLink, Pin } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Post } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import TimeUtility from '@/lib/utils/TimeUtility';
import VoteControl from './VoteControl';
import ShareButton from './ShareButton';
import { CommentCountButton, PostOptions } from './PostActions';
import PostBody from './PostBody';
import { stripMarkdown } from '@/components/common/Markdown';

export function getPostPath(post: Pick<Post, 'community' | 'short_id' | 'slug'>): string {
    return `/c/${post.community.name}/${post.short_id}${post.slug ? `/${post.slug}` : ''}`;
}

export function authorName(author: Post['author']): string {
    return author?.username ?? 'Anonymous';
}

function linkHost(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

type PostCardProps = {
    post: Post;
    // compact: a feed item that links to the thread. full: the post at the top of its own thread.
    variant?: 'compact' | 'full';
    // Hide the community name when the list is already inside that community
    showCommunity?: boolean;
    className?: string;
};

export function PostCard({ post, variant = 'compact', showCommunity = true, className }: PostCardProps) {
    const isCompact = variant === 'compact';
    const postPath = getPostPath(post);
    const communityName = post.community.name;
    const TitleTag = isCompact ? 'h2' : 'h1';
    const isLocked = post.status === 'locked';

    return (
        <article
            className={twMerge(
                'relative flex flex-col gap-2 px-4 py-3',
                isCompact && 'bg-surface transition-colors hover:bg-surface-muted/60 sm:rounded-xl sm:border sm:border-border',
                className
            )}
        >
            {/* Whole card is clickable; links and buttons inside sit above this with z-10 */}
            {isCompact && <Link href={postPath} className="absolute inset-0 sm:rounded-xl" aria-label={post.title} />}

            <header className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
                    {showCommunity ? (
                        <Link
                            href={`/c/${communityName}`}
                            className="relative z-10 flex min-w-0 items-center gap-1.5 font-bold text-text hover:underline"
                        >
                            <Avatar name={communityName} src={post.community.image_url} size="sm" />
                            <span className="truncate">c/{communityName}</span>
                        </Link>
                    ) : (
                        <span className="truncate font-bold text-text">{authorName(post.author)}</span>
                    )}
                    <span aria-hidden>•</span>
                    <time dateTime={post.created_at} className="shrink-0">
                        {TimeUtility.formatTimeAgo(post.created_at)}
                    </time>
                    {showCommunity && !isCompact && (
                        <>
                            <span aria-hidden>•</span>
                            <span className="truncate">{authorName(post.author)}</span>
                        </>
                    )}
                    {post.pinned_at && <Pin className="size-3.5 shrink-0 text-success" aria-label="Pinned" />}
                </div>
                <PostOptions post={post} leaveOnDelete={!isCompact} />
            </header>

            <TitleTag className={twMerge('font-bold leading-snug break-words', isCompact ? 'text-lg' : 'text-2xl')}>
                {post.title}
            </TitleTag>

            {(post.flair || post.is_nsfw || isLocked) && (
                <div className="flex flex-wrap gap-1.5">
                    {post.flair && <Badge>{post.flair.name}</Badge>}
                    {post.is_nsfw && <Badge variant="danger">NSFW</Badge>}
                    {isLocked && <Badge>Locked</Badge>}
                </div>
            )}

            {post.type === 'link' && post.url && <LinkPreviewCard post={post} compact={isCompact} />}

            {isCompact
                ? post.body && <p className="line-clamp-3 break-words text-sm text-muted">{stripMarkdown(post.body)}</p>
                : <PostBody post={post} />}

            <footer className="mt-1 flex flex-wrap items-center gap-2">
                <VoteControl
                    target="posts"
                    id={post.id}
                    upvotes={post.upvote_count}
                    downvotes={post.downvote_count}
                    userVote={post.viewer?.vote ?? 0}
                />
                <CommentCountButton post={post} href={`${postPath}#comments`} />
                <ShareButton path={postPath} title={post.title} />
            </footer>
        </article>
    );
}

function LinkPreviewCard({ post, compact }: { post: Post; compact: boolean }) {
    const url = post.url!;
    const preview = post.link_preview;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="relative z-10 flex items-stretch overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-strong"
        >
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2">
                {preview?.title && !compact && <span className="line-clamp-2 text-sm font-bold">{preview.title}</span>}
                <span className="flex items-center gap-1 truncate text-xs text-link">
                    {linkHost(url)} <ExternalLink className="size-3 shrink-0" />
                </span>
            </div>
            {preview?.image && (
                // Remote preview images come from any site, so next/image's allow-list doesn't apply
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.image} alt="" loading="lazy" className="h-16 w-24 shrink-0 object-cover sm:h-20 sm:w-32" />
            )}
        </a>
    );
}

export default PostCard;
