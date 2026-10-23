import Button from '@/components/ui/Button';
import NumberUtility from '@/lib/utils/NumberUtility';
import { MessageCircle, Share, Triangle } from 'lucide-react';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

type ReplyActionsProps = ComponentProps<'div'> & {
    buttonZIndex: string;
    upvotes: number;
    downvotes: number;
    toggleReplyMode: () => void;
};

export function ReplyActions({
    className,
    buttonZIndex,
    upvotes,
    downvotes,
    toggleReplyMode,
    ...props
}: ReplyActionsProps) {
    return (
        <div {...props} className={twMerge('flex items-start gap-1.5 text-sm text-gray-700', className)}>
            <div className="flex flex-col items-center justify-center gap-0">
                <Button size="round" variant="transparent" className={buttonZIndex}>
                    <Triangle className="size-5" />
                </Button>
                <span className="-mt-1.5">{NumberUtility.compactFormatter.format(upvotes)}</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-0">
                <Button size="round" variant="transparent" className={buttonZIndex}>
                    <Triangle className="size-5 rotate-180" />
                </Button>
                <span className="-mt-1.5">{NumberUtility.compactFormatter.format(downvotes)}</span>
            </div>

            <Button
                onClick={toggleReplyMode}
                size="round"
                variant="transparent"
                className={twMerge(buttonZIndex, 'flex items-center gap-1')}
            >
                <MessageCircle className="size-5" />
                <span>Reply</span>
            </Button>

            <Button size="round" variant="transparent" className={buttonZIndex}>
                <Share className="size-5" />
            </Button>
        </div>
    );
}
