import Link from 'next/link';
import Markdown from '@/components/common/Markdown';
import TimeUtility from '@/lib/utils/TimeUtility';
import { ListedComment } from '@/types/api';
import VoteControl from './VoteControl';
import ViewCount from './ViewCount';
import { humanizeHandle } from '@/lib/communityName';

// A comment shown outside its thread (on a profile), linking back to where it was said
export function CommentListItem({ comment }: { comment: ListedComment }) {
    const community = comment.post.community;
    const postPath = `/c/${community}/${comment.post.short_id}${comment.post.slug ? `/${comment.post.slug}` : ''}`;

    return (
        <article className="flex flex-col gap-1.5 px-4 py-4 sm:px-0">
            <p className="text-[13px] text-subtle">
                <Link href={`/c/${community}`} className="font-semibold text-text hover:underline">
                    {humanizeHandle(community)}
                </Link>{' '}
                · on{' '}
                <Link href={`${postPath}?comment=${comment.short_id}`} className="font-medium text-text hover:underline">
                    {comment.post.title}
                </Link>{' '}
                · <time dateTime={comment.created_at}>{TimeUtility.formatTimeAgo(comment.created_at)}</time>
            </p>
            <Markdown text={comment.body} className="line-clamp-6 text-sm leading-[21px] text-body" />
            <div className="mt-1 flex items-center gap-1">
                <VoteControl
                    target="comments"
                    id={comment.id}
                    upvotes={comment.upvote_count}
                    downvotes={comment.downvote_count}
                    userVote={comment.viewer?.vote ?? 0}
                />
                <ViewCount views={comment.viewer?.views} />
            </div>
        </article>
    );
}

export default CommentListItem;
