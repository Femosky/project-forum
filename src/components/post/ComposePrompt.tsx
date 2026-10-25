import Link from 'next/link';
import { SquarePen } from 'lucide-react';

// The quiet "start a post" row at the top of the home feed. A link, so it works for everyone; the composer asks
// guests to sign in.
export function ComposePrompt() {
    return (
        <Link
            href="/submit"
            className="group flex items-center gap-3 border-b border-border px-4 py-4 text-subtle transition-colors sm:px-0"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-active text-muted">
                <SquarePen className="size-4" />
            </span>
            <span className="flex-1 text-[15px] group-hover:text-muted">What do you want to talk about?</span>
            <span className="hidden h-8 items-center rounded-[7px] bg-accent px-3 text-[13.5px] font-semibold text-accent-fg sm:flex">
                New post
            </span>
        </Link>
    );
}

export default ComposePrompt;
