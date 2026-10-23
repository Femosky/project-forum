import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Post } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import NumberUtility from '@/lib/utils/NumberUtility';
import TimeUtility from '@/lib/utils/TimeUtility';
import VoteControl from './VoteControl';
import ShareButton from './ShareButton';
import ContentOptionsMenu from './ContentOptionsMenu';

export function getPostPath(post: Post): string {
    return `/community/${post.community_ref.name}/replies/${post.short_id}`;
}

type PostCardProps = {
    post: Post;
    // compact: a feed item that links to the thread. full: the post at the top of its own thread.
    variant?: 'compact' | 'full';
    className?: string;
};

export function PostCard({ post, variant = 'compact', className }: PostCardProps) {
    const isCompact = variant === 'compact';
    const postPath = getPostPath(post);
    const communityName = post.community_ref.name;
    const TitleTag = isCompact ? 'h2' : 'h1';

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
                    <Link
                        href={`/community/${communityName}`}
                        className="relative z-10 flex items-center gap-1.5 font-bold text-text hover:underline"
                    >
                        <Avatar name={communityName} size="sm" />
                        <span className="truncate">c/{communityName}</span>
                    </Link>
                    <span aria-hidden>•</span>
                    <time dateTime={post.created_at} className="shrink-0">
                        {TimeUtility.formatTimeAgo(post.created_at)}
                    </time>
                    {!isCompact && (
                        <>
                            <span aria-hidden>•</span>
                            <span className="truncate">{post.author_ref?.username ?? 'Anonymous'}</span>
                        </>
                    )}
                </div>
                <ContentOptionsMenu label="Post options" />
            </header>

            <TitleTag className={twMerge('font-bold leading-snug', isCompact ? 'text-lg' : 'text-2xl')}>
                {post.title}
            </TitleTag>

            {post.content && (
                <p className={twMerge('whitespace-pre-wrap break-words', isCompact ? 'line-clamp-3 text-sm text-muted' : 'text-base')}>
                    {post.content}
                </p>
            )}

            <footer className="mt-1 flex flex-wrap items-center gap-2">
                <VoteControl upvotes={post._count.upvoters} downvotes={post._count.downvoters} />

                <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="relative z-10 h-8 text-sm"
                >
                    <Link href={`${postPath}#comments`}>
                        <MessageCircle className="size-4" />
                        <span className="tabular-nums">{NumberUtility.compactFormatter.format(post._count.comments)}</span>
                        <span className="sr-only">comments</span>
                    </Link>
                </Button>

                <ShareButton path={postPath} title={post.title} />
            </footer>
        </article>
    );
}

export default PostCard;
