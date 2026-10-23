'use client';

import { useRef, useState } from 'react';
import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import NumberUtility from '@/lib/utils/NumberUtility';
import { api } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { VoteResponse, VoteValue } from '@/types/api';

type VoteControlProps = {
    target: 'posts' | 'comments';
    id: string;
    upvotes: number;
    downvotes: number;
    // Which way the viewer voted (0 for guests)
    userVote?: VoteValue;
    disabled?: boolean;
    className?: string;
};

type VoteState = { up: number; down: number; vote: VoteValue };

// Applies a vote change to the counts the way the API will, so the score moves before the request returns
function applyVote(state: VoteState, next: VoteValue): VoteState {
    const up = state.up - (state.vote === 1 ? 1 : 0) + (next === 1 ? 1 : 0);
    const down = state.down - (state.vote === -1 ? 1 : 0) + (next === -1 ? 1 : 0);
    return { up, down, vote: next };
}

// Score pill shared by posts and comments. One tap votes, a second tap on the same arrow clears it.
export function VoteControl({ target, id, upvotes, downvotes, userVote = 0, disabled, className }: VoteControlProps) {
    const [state, setState] = useState<VoteState>({ up: upvotes, down: downvotes, vote: userVote });
    const [error, setError] = useState(false);
    const requireAuth = useRequireAuth();
    // Only the latest tap's response may settle the counts
    const latest = useRef(0);

    async function vote(direction: 1 | -1) {
        if (!requireAuth('vote')) return;
        const previous = state;
        const next: VoteValue = state.vote === direction ? 0 : direction;
        const request = ++latest.current;
        setState(applyVote(state, next));
        setError(false);

        try {
            const result = await api<VoteResponse>(`/${target}/${id}/vote`, { method: 'PUT', body: { value: next } });
            if (request === latest.current) {
                setState({ up: result.upvote_count, down: result.downvote_count, vote: result.vote });
            }
        } catch {
            if (request === latest.current) {
                setState(previous);
                setError(true);
            }
        }
    }

    const score = state.up - state.down;
    const { vote: userVoteNow } = state;

    return (
        <div
            className={twMerge(
                'relative z-10 inline-flex h-8 items-center rounded-full bg-surface-muted text-sm font-bold',
                userVoteNow === 1 && 'text-upvote',
                userVoteNow === -1 && 'text-downvote',
                className
            )}
            title={error ? "Your vote didn't go through. Try again." : undefined}
        >
            <button
                type="button"
                aria-label="Upvote"
                aria-pressed={userVoteNow === 1}
                disabled={disabled}
                onClick={() => vote(1)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-border hover:text-upvote disabled:cursor-not-allowed disabled:opacity-50"
            >
                <ArrowBigUp className={twMerge('size-5', userVoteNow === 1 && 'fill-current text-upvote')} />
            </button>
            <span className="min-w-6 text-center tabular-nums" aria-live="polite" aria-label={`Score ${score}`}>
                {NumberUtility.compactFormatter.format(score)}
            </span>
            <button
                type="button"
                aria-label="Downvote"
                aria-pressed={userVoteNow === -1}
                disabled={disabled}
                onClick={() => vote(-1)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-border hover:text-downvote disabled:cursor-not-allowed disabled:opacity-50"
            >
                <ArrowBigDown className={twMerge('size-5', userVoteNow === -1 && 'fill-current text-downvote')} />
            </button>
        </div>
    );
}

export default VoteControl;
