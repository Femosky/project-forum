import Button from '@/components/ui/Button';
import NumberUtility from '@/lib/utils/NumberUtility';
import { MessageCircle, Share, Triangle } from 'lucide-react';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

type PostActionsProps = ComponentProps<'div'> & {
    removeInvisibleButton: boolean;
    buttonZIndex: string;
    upvotes: number;
    downvotes: number;
    commentsCount: number;
};

export function PostActions({
    className,
    removeInvisibleButton = false,
    buttonZIndex,
    upvotes,
    downvotes,
    commentsCount,
    ...props
}: PostActionsProps) {
    return (
        <div {...props} className={twMerge('flex items-start justify-between text-sm text-gray-700', className)}>
            {!removeInvisibleButton && (
                <Button className="invisible" size="round" variant="transparent" disabled={true}>
                    <Share className="size-5" />
                </Button>
            )}

            <div className="flex self-center gap-1.5">
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

                <div className="flex flex-col items-center justify-center gap-0">
                    <Button size="round" variant="transparent" className={buttonZIndex}>
                        <MessageCircle className="size-5" />
                    </Button>
                    <span className="-mt-1.5">{NumberUtility.compactFormatter.format(commentsCount)}</span>
                </div>
            </div>

            <Button size="round" variant="transparent" className={buttonZIndex}>
                <Share className="size-5" />
            </Button>
        </div>
    );
}
