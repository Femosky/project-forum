import Link from 'next/link';
import Markdown from '@/components/common/Markdown';
import TimeUtility from '@/lib/utils/TimeUtility';
import { ListedComment } from '@/types/api';
import VoteControl from './VoteControl';

// A comment shown outside its thread (on a profile), linking back to where it was said
export function CommentListItem({ comment }: { comment: ListedComment }) {
    const postPath = `/c/${comment.post.community}/${comment.post.short_id}${comment.post.slug ? `/${comment.post.slug}` : ''}`;

    return (
        <article className="flex flex-col gap-1.5 px-4 py-3">
            <p className="text-xs text-muted">
                <Link href={`/c/${comment.post.community}`} className="font-bold text-text hover:underline">
                    c/{comment.post.community}
                </Link>{' '}
                • on{' '}
                <Link href={`${postPath}?comment=${comment.short_id}`} className="font-semibold text-link hover:underline">
                    {comment.post.title}
                </Link>{' '}
                • <time dateTime={comment.created_at}>{TimeUtility.formatTimeAgo(comment.created_at)}</time>
            </p>
            <Markdown text={comment.body} className="line-clamp-6 text-sm" />
            <div className="-ml-1">
                <VoteControl
                    target="comments"
                    id={comment.id}
                    upvotes={comment.upvote_count}
                    downvotes={comment.downvote_count}
                    userVote={comment.viewer?.vote ?? 0}
                    className="bg-transparent"
                />
            </div>
        </article>
    );
}

export default CommentListItem;
