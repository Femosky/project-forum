'use client';

import Button from '@/components/ui/Button';
import VoteControl from '@/components/post/VoteControl';
import ContentOptionsMenu from '@/components/post/ContentOptionsMenu';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';
import { Comment } from '@/types/api';
import ViewCount from '@/components/post/ViewCount';

type ReplyActionsProps = ComponentProps<'div'> & {
    comment: Comment;
    canReply: boolean;
    isReplying: boolean;
    toggleReplyMode: () => void;
    onDeleted: () => void;
    onEdit: () => void;
    // Present when the viewer moderates this community
    onModerated?: (comment: Comment) => void;
};

export function ReplyActions({
    className,
    comment,
    canReply,
    isReplying,
    toggleReplyMode,
    onDeleted,
    onEdit,
    onModerated,
    ...props
}: ReplyActionsProps) {
    const requireAuth = useRequireAuth();
    const isGone = comment.status === 'deleted' || comment.status === 'removed';

    function handleReplyClick() {
        if (!isReplying && !requireAuth('reply')) return;
        toggleReplyMode();
    }

    return (
        <div {...props} className={twMerge('mt-1 flex items-center gap-1', className)}>
            <VoteControl
                target="comments"
                id={comment.id}
                upvotes={comment.upvote_count}
                downvotes={comment.downvote_count}
                userVote={comment.viewer?.vote ?? 0}
                disabled={isGone}
            />

            {canReply && (
                <Button
                    onClick={handleReplyClick}
                    variant="ghost"
                    size="sm"
                    aria-expanded={isReplying}
                    className="h-7 px-2 font-semibold text-subtle hover:text-text"
                >
                    Reply
                </Button>
            )}

            {(!isGone || (onModerated && comment.status === 'removed')) && (
                <ContentOptionsMenu
                    targetType="comment"
                    id={comment.id}
                    saved={comment.viewer?.saved}
                    isAuthor={comment.viewer?.is_author}
                    onDeleted={onDeleted}
                    onEdit={onEdit}
                    moderation={
                        onModerated && {
                            status: comment.status,
                            pinned: Boolean(comment.pinned_at),
                            canPin: comment.depth === 0,
                            onModerated: (body) => onModerated((body as { comment: Comment }).comment),
                        }
                    }
                />
            )}
            <ViewCount views={comment.viewer?.views} />
        </div>
    );
}
