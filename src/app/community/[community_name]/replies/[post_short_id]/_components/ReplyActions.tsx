import Button from '@/components/ui/Button';
import VoteControl from '@/components/post/VoteControl';
import ContentOptionsMenu from '@/components/post/ContentOptionsMenu';
import { MessageCircle } from 'lucide-react';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

type ReplyActionsProps = ComponentProps<'div'> & {
    upvotes: number;
    downvotes: number;
    isReplying: boolean;
    toggleReplyMode: () => void;
};

export function ReplyActions({
    className,
    upvotes,
    downvotes,
    isReplying,
    toggleReplyMode,
    ...props
}: ReplyActionsProps) {
    return (
        <div {...props} className={twMerge('-ml-1 flex items-center gap-1', className)}>
            <VoteControl upvotes={upvotes} downvotes={downvotes} className="bg-transparent" />

            <Button
                onClick={toggleReplyMode}
                variant="ghost"
                size="sm"
                aria-expanded={isReplying}
                className="text-muted hover:text-text"
            >
                <MessageCircle className="size-4" />
                Reply
            </Button>

            <ContentOptionsMenu label="Comment options" />
        </div>
    );
}
