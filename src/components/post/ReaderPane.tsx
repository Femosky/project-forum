'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Maximize2, X } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';

type ReaderPaneProps = { shortId: string; community: string; children: React.ReactNode };

// Keys that move between posts and close the pane. Ignored while typing.
function isTyping(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

// The split view's reading pane (see globals.css). Beside the list on wide screens, over it on narrow ones.
export default function ReaderPane({ shortId, community, children }: ReaderPaneProps) {
    const router = useRouter();
    const pathname = usePathname();
    const pane = useRef<HTMLElement>(null);
    // A slot keeps its last content when client navigation leaves for a page it has no route for, so the pane
    // closes itself once the URL is no longer this post. (A catch-all route in the slot would do this too, but it
    // sends the dev server into an endless reload loop.)
    const isOpen = pathname.split('/')[3] === shortId;

    // Each post starts at its top, and keyboard focus moves into the pane
    useEffect(() => {
        if (!isOpen) return;
        pane.current?.scrollTo({ top: 0 });
        pane.current?.focus({ preventScroll: true });
    }, [shortId, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        function onKey(event: KeyboardEvent) {
            if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
            if (event.key === 'Escape') {
                router.back();
            } else if (event.key === 'j' || event.key === 'k') {
                // Next or previous post in the list underneath. Replace, so Back still closes the pane.
                const rows = [...document.querySelectorAll<HTMLElement>('main [data-list] [data-post-card]')];
                const index = rows.findIndex((row) => row.dataset.postCard === shortId);
                const next = rows[index + (event.key === 'j' ? 1 : -1)];
                const href = next?.querySelector<HTMLAnchorElement>('a[data-post-link]')?.getAttribute('href');
                if (!href) return;
                next.scrollIntoView({ block: 'nearest' });
                router.replace(href, { scroll: false });
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [router, shortId, isOpen]);

    if (!isOpen) return null;

    return (
        <aside
            ref={pane}
            data-reader
            tabIndex={-1}
            aria-label="Post"
            className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-bg outline-none [--reply-bottom:0px] xl:sticky xl:top-header xl:z-auto xl:h-[calc(100dvh-var(--spacing-header))] xl:min-w-0 xl:flex-1"
        >
            {/* Highlights this post's row in the list. Short ids are letters and digits; anything else gets no highlight. */}
            {/^\w+$/.test(shortId) && (
                <style>{`[data-post-card="${shortId}"]{background-color:var(--surface-raised)}[data-post-card="${shortId}"]::before{content:"";position:absolute;inset-block:.75rem;left:0;width:3px;border-radius:0 3px 3px 0;background:var(--accent)}`}</style>
            )}
            <div className="sticky top-0 z-20 flex h-12 items-center gap-1 border-b border-border bg-bg/95 px-2 text-sm backdrop-blur">
                <IconButton aria-label="Close post" onClick={() => router.back()}>
                    <ArrowLeft className="xl:hidden" />
                    <X className="hidden xl:block" />
                </IconButton>
                <Link href={`/c/${community}`} className="truncate font-semibold text-muted hover:text-text">
                    c/{community}
                </Link>
                <span className="flex-1" />
                <span className="mr-2 hidden items-center gap-1 text-xs text-muted xl:flex">
                    <kbd className="rounded bg-surface-muted px-1.5 font-sans">J</kbd>
                    <kbd className="rounded bg-surface-muted px-1.5 font-sans">K</kbd> to move
                </span>
                {/* A plain link, so it loads the post as its own page (which redirects to the full URL) */}
                <IconButton asChild aria-label="Open as a full page">
                    <a href={`/c/${community}/${shortId}`}>
                        <Maximize2 />
                    </a>
                </IconButton>
            </div>
            {children}
        </aside>
    );
}
