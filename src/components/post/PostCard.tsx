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

// How a community is named in the interface: its display name, or its name. URLs keep /c/{name}.
export function communityLabel(community: Pick<Post['community'], 'name' | 'display_name'>): string {
    return community.display_name || community.name;
}

export function getPostPath(post: Pick<Post, 'community' | 'short_id' | 'slug'>): string {
    return `/c/${post.community.name}/${post.short_id}${post.slug ? `/${post.slug}` : ''}`;
}

// The author's name, linking to their profile unless the post is anonymous
function AuthorLink({ author, className }: { author: Post['author']; className?: string }) {
    if (!author) return <span className={className}>Anonymous</span>;
    return (
        <Link href={`/u/${author.username}`} className={twMerge('relative z-10 hover:underline', className)}>
            {author.username}
        </Link>
    );
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
    // Shows moderator tools in the post's menu
    isModerator?: boolean;
    className?: string;
};

export function PostCard({ post, variant = 'compact', showCommunity = true, isModerator = false, className }: PostCardProps) {
    const isCompact = variant === 'compact';
    const postPath = getPostPath(post);
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

            {/* Who and where: above the title on the post's own page, in the footer of a feed item */}
            {isCompact ? (
                <div className="flex items-start justify-between gap-2">
                    <TitleTag className="text-lg font-bold leading-snug break-words">{post.title}</TitleTag>
                    <div className="-mr-2 -mt-1">
                        <PostOptions post={post} leaveOnDelete={false} isModerator={isModerator} />
                    </div>
                </div>
            ) : (
                <>
                    <header className="flex items-center justify-between gap-2">
                        <PostMeta post={post} showCommunity={showCommunity} withAuthor />
                        <PostOptions post={post} leaveOnDelete isModerator={isModerator} />
                    </header>
                    <TitleTag className="text-2xl font-bold leading-snug break-words">{post.title}</TitleTag>
                </>
            )}

            {(post.flair || post.is_nsfw || isLocked || post.status === 'removed' || post.status === 'pending') && (
                <div className="flex flex-wrap gap-1.5">
                    {post.flair && <Badge>{post.flair.name}</Badge>}
                    {post.is_nsfw && <Badge variant="danger">NSFW</Badge>}
                    {isLocked && <Badge>Locked</Badge>}
                    {post.status === 'removed' && <Badge variant="danger">Removed by moderators</Badge>}
                    {post.status === 'pending' && <Badge variant="highlight">{post.held_reason ? `Held: ${post.held_reason}` : 'Waiting for review'}</Badge>}
                </div>
            )}

            {post.type === 'link' && post.url && <LinkPreviewCard post={post} compact={isCompact} />}

            {isCompact
                ? post.body && <p className="line-clamp-3 break-words text-sm text-muted">{stripMarkdown(post.body)}</p>
                : <PostBody post={post} />}

            <footer className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                {isCompact && <PostMeta post={post} showCommunity={showCommunity} />}
                <div className="flex items-center gap-1.5">
                    <VoteControl
                        target="posts"
                        id={post.id}
                        upvotes={post.upvote_count}
                        downvotes={post.downvote_count}
                        userVote={post.viewer?.vote ?? 0}
                    />
                    <CommentCountButton post={post} href={`${postPath}#comments`} />
                    <ShareButton path={postPath} title={post.title} />
                </div>
            </footer>
        </article>
    );
}

// Community (or author, inside a community) and age. Community names are shown as names, without a prefix.
function PostMeta({ post, showCommunity, withAuthor = false }: { post: Post; showCommunity: boolean; withAuthor?: boolean }) {
    const communityName = post.community.name;
    return (
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
            {showCommunity ? (
                <Link
                    href={`/c/${communityName}`}
                    className="relative z-10 flex min-w-0 items-center gap-1.5 font-bold text-text hover:underline"
                >
                    <Avatar name={communityName} src={post.community.image_url} size="sm" />
                    <span className="truncate">{communityLabel(post.community)}</span>
                </Link>
            ) : (
                <AuthorLink author={post.author} className="truncate font-bold text-text" />
            )}
            <span aria-hidden>·</span>
            <time dateTime={post.created_at} className="shrink-0">
                {TimeUtility.formatTimeAgo(post.created_at)}
            </time>
            {showCommunity && withAuthor && (
                <>
                    <span aria-hidden>·</span>
                    <AuthorLink author={post.author} className="truncate" />
                </>
            )}
            {post.pinned_at && <Pin className="size-3.5 shrink-0 text-accent" aria-label="Pinned" />}
        </div>
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
                <img src={preview.image} alt="" loading="lazy" className="data-saver-hide h-16 w-24 shrink-0 object-cover sm:h-20 sm:w-32" />
            )}
        </a>
    );
}

export default PostCard;
