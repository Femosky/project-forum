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
import { communityLabel } from '@/lib/communityName';
import ViewCount from './ViewCount';
import UserAvatar from '@/components/ui/UserAvatar';

// How a community is named in the interface (see lib/communityName)
export { communityLabel };

export function getPostPath(post: Pick<Post, 'community' | 'short_id' | 'slug'>): string {
    return `/c/${post.community.name}/${post.short_id}${post.slug ? `/${post.slug}` : ''}`;
}

// Who a post shows as written by when the API sends no author: its author deleted it, or it is anonymous
const hiddenAuthorName = (post: Post) => (post.status === 'deleted' ? '[deleted]' : 'Anonymous');

// The author's name, linking to their profile unless the post is anonymous or deleted
function AuthorLink({ author, fallback, className }: { author: Post['author']; fallback: string; className?: string }) {
    if (!author) return <span className={className}>{fallback}</span>;
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
    // compact: a feed row that links to the thread. full: the post at the top of its own page.
    variant?: 'compact' | 'full';
    // Hide the community tag when the list is already inside that community
    showCommunity?: boolean;
    // Shows moderator tools in the post's menu
    isModerator?: boolean;
    className?: string;
};

// The community a post lives in, as a small outlined tag with its icon
export function CommunityTag({ community, className }: { community: Post['community']; className?: string }) {
    return (
        <Link
            href={`/c/${community.name}`}
            className={twMerge(
                'relative z-10 inline-flex h-[22px] min-w-0 shrink items-center gap-1.5 rounded-md pl-[3px] pr-2 text-[12.5px] font-medium text-muted ring-1 ring-inset ring-border transition-colors hover:text-text hover:ring-border-strong',
                className
            )}
        >
            <Avatar name={community.name} src={community.image_url} shape="square" className="size-4 text-[9px]" />
            <span className="truncate">{communityLabel(community)}</span>
        </Link>
    );
}

// Threads-style feed row (author avatar on the left, title first, preview, actions) or the head of a post's page
export function PostCard({ post, variant = 'compact', showCommunity = true, isModerator = false, className }: PostCardProps) {
    const isCompact = variant === 'compact';
    const postPath = getPostPath(post);
    const isLocked = post.status === 'locked';
    // A tombstone: the author deleted it but comments remain. No votes, no menu, "[deleted]" for author and body.
    const isDeleted = post.status === 'deleted';
    const authorName = post.author?.username ?? hiddenAuthorName(post);

    const badges = (post.flair || post.is_nsfw || isLocked || post.status === 'removed' || post.status === 'pending') && (
        <div className="flex flex-wrap gap-1.5">
            {post.flair && <Badge>{post.flair.name}</Badge>}
            {post.is_nsfw && <Badge variant="danger">NSFW</Badge>}
            {isLocked && <Badge>Locked</Badge>}
            {post.status === 'removed' && <Badge variant="danger">Removed by moderators</Badge>}
            {post.status === 'pending' && <Badge variant="highlight">{post.held_reason ? `Held: ${post.held_reason}` : 'Waiting for review'}</Badge>}
        </div>
    );

    const actions = (
        <div className="-ml-0.5 flex flex-wrap items-center gap-1">
            {!isDeleted && (
                <VoteControl
                    target="posts"
                    id={post.id}
                    upvotes={post.upvote_count}
                    downvotes={post.downvote_count}
                    userVote={post.viewer?.vote ?? 0}
                />
            )}
            <CommentCountButton post={post} href={`${postPath}#comments`} />
            <ShareButton path={postPath} title={post.title} />
            <ViewCount views={post.viewer?.views} />
        </div>
    );

    if (!isCompact) {
        return (
            <article className={twMerge('flex flex-col gap-3 px-4 pb-5 pt-7 sm:px-0', className)}>
                <header className="flex items-center gap-2">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-subtle">
                        <UserAvatar user={post.author} size={22} className="size-[22px]" />
                        <AuthorLink author={post.author} fallback={authorName} className="font-semibold text-text" />
                        {showCommunity && (
                            <>
                                <span>in</span>
                                <CommunityTag community={post.community} />
                            </>
                        )}
                        <span aria-hidden>·</span>
                        <PostTime post={post} />
                    </div>
                    {!isDeleted && <PostOptions post={post} leaveOnDelete isModerator={isModerator} />}
                </header>
                <h1 className="text-[22px] font-medium leading-[29px] tracking-[-0.015em] break-words text-pretty">{post.title}</h1>
                {badges}
                {post.type === 'link' && post.url && <LinkPreviewCard post={post} />}
                <div className="text-[15px] leading-6 text-body">
                    {isDeleted ? <p className="italic text-muted">[deleted]</p> : <PostBody post={post} />}
                </div>
                <div className="pt-1">{actions}</div>
            </article>
        );
    }

    return (
        <article
            className={twMerge(
                // The hover wash reaches a little past the text on both sides, like a list row
                "group relative grid grid-cols-[36px_minmax(0,1fr)] gap-3 px-4 pb-4 pt-[22px] before:absolute before:inset-y-1 before:inset-x-1 before:-z-0 before:rounded-[10px] before:transition-colors before:content-[''] hover:before:bg-hover sm:px-0 sm:before:-inset-x-3",
                className
            )}
        >
            {/* Whole row is clickable; links and buttons inside sit above this with z-10 */}
            <Link href={postPath} className="absolute inset-0 z-[1]" aria-label={post.title} />

            <AuthorAvatar author={post.author} />

            <div className="relative z-[2] flex min-w-0 flex-col pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
                <div className="flex min-w-0 items-center gap-1.5 text-[13px] leading-[18px] text-muted">
                    <AuthorLink author={post.author} fallback={authorName} className="shrink-0 font-semibold text-text" />
                    {showCommunity && <CommunityTag community={post.community} />}
                    <PostTime post={post} className="text-subtle" />
                    <div className="-my-1 -mr-1.5 ml-auto">
                        {!isDeleted && <PostOptions post={post} leaveOnDelete={false} isModerator={isModerator} />}
                    </div>
                </div>

                <h2 className="mb-1 mt-2 text-[15.5px] font-medium leading-[22px] tracking-[-0.003em] break-words text-pretty">{post.title}</h2>
                {badges && <div className="mb-1">{badges}</div>}
                {isDeleted && <p className="text-[14.5px] italic leading-[22px] text-muted">[deleted]</p>}
                {post.body && post.type !== 'link' && (
                    <p className="line-clamp-2 break-words text-[14.5px] leading-[22px] text-muted">{stripMarkdown(post.body)}</p>
                )}
                {post.type === 'link' && post.url && (
                    <div className="mt-2.5">
                        <LinkPreviewCard post={post} />
                    </div>
                )}

                <div className="mt-3.5">{actions}</div>
            </div>
        </article>
    );
}

// The author's picture, linking to their profile; a neutral letter for anonymous and deleted posts
function AuthorAvatar({ author }: { author: Post['author'] }) {
    if (!author) return <UserAvatar user={null} size={36} className="size-9" />;
    return (
        <Link href={`/u/${author.username}`} className="relative z-10 self-start" aria-label={author.username} tabIndex={-1}>
            <UserAvatar user={author} size={36} className="size-9" />
        </Link>
    );
}

function PostTime({ post, className }: { post: Post; className?: string }) {
    return (
        <span className={twMerge('flex shrink-0 items-center gap-1', className)}>
            <time dateTime={post.created_at}>{TimeUtility.formatTimeAgo(post.created_at)}</time>
            {post.pinned_at && <Pin className="size-3.5 text-brand" aria-label="Pinned" />}
        </span>
    );
}

function LinkPreviewCard({ post }: { post: Post }) {
    const url = post.url!;
    const preview = post.link_preview;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="relative z-10 flex items-center overflow-hidden rounded-[10px] ring-1 ring-inset ring-border transition-colors hover:ring-border-strong"
        >
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5">
                {preview?.title && <span className="line-clamp-2 text-sm font-semibold">{preview.title}</span>}
                <span className="flex items-center gap-1 truncate text-[12.5px] text-subtle">
                    {linkHost(url)} <ExternalLink className="size-3 shrink-0" />
                </span>
            </div>
            {preview?.image && (
                // Remote preview images come from any site, so next/image's allow-list doesn't apply
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.image} alt="" loading="lazy" className="data-saver-hide h-16 w-24 shrink-0 object-cover" />
            )}
        </a>
    );
}

export default PostCard;
