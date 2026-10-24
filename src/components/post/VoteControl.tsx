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
    // sm: list rows and comments; md: the open post
    size?: 'sm' | 'md';
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
export function VoteControl({ target, id, upvotes, downvotes, userVote = 0, disabled, size = 'sm', className }: VoteControlProps) {
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
    const arrow = twMerge(
        'flex h-full cursor-pointer items-center justify-center text-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'w-7 rounded-md hover:bg-surface-muted' : 'w-9 hover:bg-surface-muted'
    );

    return (
        // sm is light enough for a list row; md is a bordered segmented control under an open post
        <div
            className={twMerge(
                'relative z-10 inline-flex items-center text-[13px] font-bold tabular-nums',
                size === 'sm' ? 'h-7' : 'h-9 overflow-hidden rounded-lg border border-border bg-surface',
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
                className={twMerge(arrow, 'hover:text-upvote', userVoteNow === 1 && size === 'md' && 'bg-highlight')}
            >
                <ArrowBigUp className={twMerge(size === 'sm' ? 'size-[18px]' : 'size-5', userVoteNow === 1 && 'fill-current text-upvote')} />
            </button>
            <span className="min-w-6 px-0.5 text-center" aria-live="polite" aria-label={`Score ${score}`}>
                {NumberUtility.compactFormatter.format(score)}
            </span>
            <button
                type="button"
                aria-label="Downvote"
                aria-pressed={userVoteNow === -1}
                disabled={disabled}
                onClick={() => vote(-1)}
                className={twMerge(arrow, 'hover:text-downvote')}
            >
                <ArrowBigDown className={twMerge(size === 'sm' ? 'size-[18px]' : 'size-5', userVoteNow === -1 && 'fill-current text-downvote')} />
            </button>
        </div>
    );
}

export default VoteControl;
