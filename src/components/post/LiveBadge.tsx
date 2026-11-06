import { twMerge } from 'tailwind-merge';
import type { PostLive } from '@/types/api';

// The red dot that marks a live thread. It pulses gently unless the reader asked for less motion (globals.css .live-dot).
export function LiveDot({ className }: { className?: string }) {
    return <span aria-hidden className={twMerge('live-dot relative inline-block size-1.5 shrink-0 rounded-full bg-brand', className)} />;
}

// "Live" while the thread runs; "Live ended" on the post's own page afterwards. Rendered on the server, so it's in
// the page from the first paint and moves nothing.
export function LiveBadge({ live, showEnded = false, className }: { live?: PostLive | null; showEnded?: boolean; className?: string }) {
    if (!live) return null;
    if (live.is_live) {
        return (
            <span className={twMerge('inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-1.5 py-px text-xs font-semibold text-brand-text', className)}>
                <LiveDot /> Live
            </span>
        );
    }
    if (!showEnded) return null;
    return <span className={twMerge('inline-flex items-center rounded-md bg-active px-1.5 py-px text-xs font-medium text-muted', className)}>Live ended</span>;
}

export default LiveBadge;
