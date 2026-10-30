'use client';

import { useState } from 'react';
import { EyeOff } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

// A mature (NSFW) post's text and preview, blurred until the reader chooses to see it. The content is laid out at
// its real size underneath, so showing it moves nothing (no layout shift), and it's inert while hidden: not
// focusable, not read out, not clickable. Guests and readers without "Show mature content" always start here.
export default function MatureBlur({ blur, children, className }: { blur: boolean; children: React.ReactNode; className?: string }) {
    const [shown, setShown] = useState(false);
    if (!blur) return <div className={className}>{children}</div>;
    // Room for the button even over a one-line post, kept after showing so nothing below moves
    if (shown) return <div className={twMerge('min-h-14', className)}>{children}</div>;
    return (
        <div className={twMerge('relative min-h-14', className)}>
            <div inert className="pointer-events-none select-none blur-md" aria-hidden>
                {children}
            </div>
            <div className="absolute inset-0 z-10 flex min-h-12 items-center justify-center">
                <button
                    type="button"
                    onClick={(event) => {
                        // In a feed row the whole row links to the thread; this button only reveals
                        event.preventDefault();
                        event.stopPropagation();
                        setShown(true);
                    }}
                    className="pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-full bg-surface-raised px-3.5 py-1.5 text-[13px] font-semibold text-text shadow-raised ring-1 ring-border transition-colors hover:ring-border-strong"
                >
                    <EyeOff className="size-4" /> Mature content · Show
                </button>
            </div>
        </div>
    );
}
