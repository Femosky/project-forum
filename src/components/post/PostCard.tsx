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
    const communityName = post.community.name;
    const TitleTag = isCompact ? 'h2' : 'h1';
    const isLocked = post.status === 'locked';

    return (
        <article
            data-post-card={isCompact ? post.short_id : undefined}
            className={twMerge(
                'relative flex flex-col',
                isCompact ? 'gap-1.5 px-4 py-3 transition-colors hover:bg-surface-muted/60' : 'gap-3 px-4 py-4',
                className
            )}
        >
            {/* Whole row is clickable; links and buttons inside sit above this with z-10. data-post-link: the
                reading pane's J/K keys follow it. */}
            {isCompact && <Link href={postPath} data-post-link className="absolute inset-0" aria-label={post.title} />}

            <header className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
                    {showCommunity ? (
                        <Link
                            href={`/c/${communityName}`}
                            className="relative z-10 flex min-w-0 items-center gap-1.5 font-bold text-text hover:underline"
                        >
                            <Avatar name={communityName} src={post.community.image_url} size="sm" shape="square" className="size-5" />
                            <span className="truncate">c/{communityName}</span>
                        </Link>
                    ) : (
                        <AuthorLink author={post.author} className="truncate font-bold text-text" />
                    )}
                    <span aria-hidden>·</span>
                    <time dateTime={post.created_at} className="shrink-0">
                        {TimeUtility.formatTimeAgo(post.created_at)}
                    </time>
                    {showCommunity && !isCompact && (
                        <>
                            <span aria-hidden>·</span>
                            <AuthorLink author={post.author} className="truncate" />
                        </>
                    )}
                    {post.pinned_at && <Pin className="size-3.5 shrink-0 text-accent" aria-label="Pinned" />}
                </div>
                <PostOptions post={post} leaveOnDelete={!isCompact} isModerator={isModerator} />
            </header>

            <TitleTag
                className={twMerge(
                    'break-words',
                    isCompact ? 'text-[15px] font-bold leading-snug' : 'text-2xl font-extrabold leading-tight tracking-tight sm:text-[1.75rem]'
                )}
            >
                {post.title}
            </TitleTag>

            {(post.flair || post.is_nsfw || isLocked || post.status === 'removed' || post.status === 'pending') && (
                <div className="flex flex-wrap gap-1.5">
                    {post.flair && <Badge>{post.flair.name}</Badge>}
                    {post.is_nsfw && <Badge variant="danger">NSFW</Badge>}
                    {isLocked && <Badge>Locked</Badge>}
                    {post.status === 'removed' && <Badge variant="danger">Removed by moderators</Badge>}
                    {post.status === 'pending' && <Badge variant="highlight">{post.held_reason ? `Held: ${post.held_reason}` : 'Waiting for review'}</Badge>}
                </div>
            )}

            {/* list-extra: hidden while the list is a narrow column beside an open post */}
            {post.type === 'link' && post.url && (
                <div className={isCompact ? 'list-extra' : undefined}>
                    <LinkPreviewCard post={post} compact={isCompact} />
                </div>
            )}

            {isCompact
                ? post.body && <p className="list-extra line-clamp-2 break-words text-sm text-muted">{stripMarkdown(post.body)}</p>
                : <PostBody post={post} />}

            <footer className={twMerge('flex flex-wrap items-center gap-1.5', isCompact ? '-ml-1' : 'mt-1')}>
                <VoteControl
                    target="posts"
                    id={post.id}
                    upvotes={post.upvote_count}
                    downvotes={post.downvote_count}
                    userVote={post.viewer?.vote ?? 0}
                    size={isCompact ? 'sm' : 'md'}
                />
                <CommentCountButton post={post} href={`${postPath}#comments`} />
                <span className={isCompact ? 'list-extra' : undefined}>
                    <ShareButton path={postPath} title={post.title} />
                </span>
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
            className="relative z-10 flex items-stretch overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong"
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
