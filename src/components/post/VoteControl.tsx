import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import NumberUtility from '@/lib/utils/NumberUtility';

type VoteControlProps = {
    upvotes: number;
    downvotes: number;
    // Which way the viewer voted, once votes are wired up
    userVote?: 1 | 0 | -1;
    className?: string;
};

// Score pill shared by posts and comments. Voting isn't wired to the API yet (Phase 3).
export function VoteControl({ upvotes, downvotes, userVote = 0, className }: VoteControlProps) {
    const score = upvotes - downvotes;

    return (
        <div
            className={twMerge(
                'relative z-10 inline-flex h-8 items-center rounded-full bg-surface-muted text-sm font-bold',
                userVote === 1 && 'text-upvote',
                userVote === -1 && 'text-downvote',
                className
            )}
        >
            <button
                type="button"
                aria-label="Upvote"
                aria-pressed={userVote === 1}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-border hover:text-upvote"
            >
                <ArrowBigUp className={twMerge('size-5', userVote === 1 && 'fill-current text-upvote')} />
            </button>
            <span className="min-w-6 text-center tabular-nums" aria-label={`Score ${score}`}>
                {NumberUtility.compactFormatter.format(score)}
            </span>
            <button
                type="button"
                aria-label="Downvote"
                aria-pressed={userVote === -1}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-border hover:text-downvote"
            >
                <ArrowBigDown className={twMerge('size-5', userVote === -1 && 'fill-current text-downvote')} />
            </button>
        </div>
    );
}

export default VoteControl;
