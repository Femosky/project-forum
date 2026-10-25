'use client';

import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Triangle } from 'lucide-react';
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
        'flex h-full cursor-pointer items-center gap-1 px-2 tabular-nums transition-colors hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-50';
    // The side you voted for gets a soft tint, a filled arrow and a bolder count: clear without shouting
    const voted = 'bg-active font-bold text-text';

    // Likes and dislikes are both shown, as separate counts, rather than folded into one score
    return (
        <div
            className={twMerge(
                'relative z-10 inline-flex h-7 items-stretch overflow-hidden rounded-[7px] text-[13px] font-semibold text-muted ring-1 ring-inset ring-border-strong',
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
                className={twMerge(side, userVoteNow === 1 && voted)}
            >
                {userVoteNow === 1 ? <Triangle className="size-3 fill-current" /> : <ChevronUp className="size-4" strokeWidth={2.4} />}
                <span aria-live="polite">{NumberUtility.compactFormatter.format(state.up)}</span>
            </button>
            <span aria-hidden className="w-px bg-border-strong" />
            <button
                type="button"
                aria-label={`Downvote, ${state.down} ${state.down === 1 ? 'downvote' : 'downvotes'}`}
                aria-pressed={userVoteNow === -1}
                disabled={disabled}
                onClick={() => vote(-1)}
                className={twMerge(side, userVoteNow === -1 && voted)}
            >
                {userVoteNow === -1 ? <Triangle className="size-3 rotate-180 fill-current" /> : <ChevronDown className="size-4" strokeWidth={2.4} />}
                <span aria-live="polite">{NumberUtility.compactFormatter.format(state.down)}</span>
            </button>
        </div>
    );
}

export default VoteControl;
