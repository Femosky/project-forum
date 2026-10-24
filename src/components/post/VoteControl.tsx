'use client';

import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

// Vote pill shared by posts and comments: likes and dislikes, each with its own count. One tap votes, a second tap on the same arrow clears it.
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

    const { vote: userVoteNow } = state;
    const side =
        'flex h-full cursor-pointer items-center gap-1 px-2.5 tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-50';

    // Likes and dislikes are both shown, as separate counts, rather than folded into one score
    return (
        <div
            className={twMerge(
                'relative z-10 inline-flex h-8 items-stretch overflow-hidden rounded-full bg-surface-muted text-sm font-bold text-muted',
                className
            )}
            title={error ? "Your vote didn't go through. Try again." : undefined}
        >
            <button
                type="button"
                aria-label={`Upvote, ${state.up} ${state.up === 1 ? 'upvote' : 'upvotes'}`}
                aria-pressed={userVoteNow === 1}
                disabled={disabled}
                onClick={() => vote(1)}
                className={twMerge(side, 'pl-2', userVoteNow === 1 ? 'bg-upvote/15 text-upvote' : 'hover:bg-upvote/10 hover:text-upvote')}
            >
                <ChevronUp className="size-5" strokeWidth={userVoteNow === 1 ? 3 : 2.25} />
                <span aria-live="polite">{NumberUtility.compactFormatter.format(state.up)}</span>
            </button>
            <span aria-hidden className="my-2 w-px bg-border" />
            <button
                type="button"
                aria-label={`Downvote, ${state.down} ${state.down === 1 ? 'downvote' : 'downvotes'}`}
                aria-pressed={userVoteNow === -1}
                disabled={disabled}
                onClick={() => vote(-1)}
                className={twMerge(side, 'pr-3', userVoteNow === -1 ? 'bg-downvote/15 text-downvote' : 'hover:bg-downvote/10 hover:text-downvote')}
            >
                <ChevronDown className="size-5" strokeWidth={userVoteNow === -1 ? 3 : 2.25} />
                <span aria-live="polite">{NumberUtility.compactFormatter.format(state.down)}</span>
            </button>
        </div>
    );
}

export default VoteControl;
