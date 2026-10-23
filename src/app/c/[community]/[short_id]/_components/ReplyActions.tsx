'use client';

import Button from '@/components/ui/Button';
import VoteControl from '@/components/post/VoteControl';
import ContentOptionsMenu from '@/components/post/ContentOptionsMenu';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { MessageCircle } from 'lucide-react';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';
import { Comment } from '@/types/api';

type ReplyActionsProps = ComponentProps<'div'> & {
    comment: Comment;
    canReply: boolean;
    isReplying: boolean;
    toggleReplyMode: () => void;
    onDeleted: () => void;
    onEdit: () => void;
};

export function ReplyActions({ className, comment, canReply, isReplying, toggleReplyMode, onDeleted, onEdit, ...props }: ReplyActionsProps) {
    const requireAuth = useRequireAuth();
    const isGone = comment.status === 'deleted' || comment.status === 'removed';

    function handleReplyClick() {
        if (!isReplying && !requireAuth('reply')) return;
        toggleReplyMode();
    }

    return (
        <div {...props} className={twMerge('-ml-1 flex items-center gap-1', className)}>
            <VoteControl
                target="comments"
                id={comment.id}
                upvotes={comment.upvote_count}
                downvotes={comment.downvote_count}
                userVote={comment.viewer?.vote ?? 0}
                disabled={isGone}
                className="bg-transparent"
            />

            {canReply && (
                <Button
                    onClick={handleReplyClick}
                    variant="ghost"
                    size="sm"
                    aria-expanded={isReplying}
                    className="text-muted hover:text-text"
                >
                    <MessageCircle className="size-4" />
                    Reply
                </Button>
            )}

            {!isGone && (
                <ContentOptionsMenu
                    targetType="comment"
                    id={comment.id}
                    saved={comment.viewer?.saved}
                    isAuthor={comment.viewer?.is_author}
                    onDeleted={onDeleted}
                    onEdit={onEdit}
                />
            )}
        </div>
    );
}
