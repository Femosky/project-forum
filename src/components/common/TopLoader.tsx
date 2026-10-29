'use client';

import { useEffect, useRef } from 'react';

// A thin progress bar while a link navigation loads (the site has no loading.tsx skeletons, see docs/ROADMAP.md
// Phase 3). Written by hand rather than with nextjs-toploader + nprogress to save about 4 KB of first-load JS.
// It starts on a click on an internal link and finishes when the URL changes (Next calls pushState/replaceState
// once the new page is ready), on back/forward, or when the page is left.
export default function TopLoader() {
    const bar = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = bar.current;
        if (!element) return;
        let timer: ReturnType<typeof setInterval> | null = null;
        let progress = 0;

        const show = (value: number, opacity = 1) => {
            element.style.transform = `scaleX(${value})`;
            element.style.opacity = String(opacity);
        };
        let safety: ReturnType<typeof setTimeout> | null = null;
        const start = () => {
            if (timer) return;
            // Something may still cancel the navigation (a handler further down, a blocked route), so a bar that is
            // still running after a while finishes on its own
            safety = setTimeout(done, 10_000);
            progress = 0.08;
            show(progress);
            // Crawl towards the end without reaching it
            timer = setInterval(() => show((progress += (0.95 - progress) * 0.08)), 250);
        };
        const done = () => {
            if (!timer) return;
            if (safety) clearTimeout(safety);
            clearInterval(timer);
            timer = null;
            show(1);
            setTimeout(() => show(1, 0), 200);
            setTimeout(() => !timer && show(0, 0), 450);
        };

        // Runs in the capture phase: by the time a click bubbles up, Next's <Link> has already called
        // preventDefault() to navigate on the client, so a bubbling listener can't tell its clicks from cancelled ones
        function onClick(event: MouseEvent) {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const link = (event.target as Element | null)?.closest?.('a');
            if (!link || !link.href || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
            const url = new URL(link.href, location.href);
            if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
            start();
        }

        const { pushState, replaceState } = history;
        history.pushState = function (...args) {
            done();
            return pushState.apply(this, args);
        };
        history.replaceState = function (...args) {
            done();
            return replaceState.apply(this, args);
        };
        document.addEventListener('click', onClick, true);
        window.addEventListener('popstate', done);
        window.addEventListener('pagehide', done);
        return () => {
            history.pushState = pushState;
            history.replaceState = replaceState;
            document.removeEventListener('click', onClick, true);
            window.removeEventListener('popstate', done);
            window.removeEventListener('pagehide', done);
            if (timer) clearInterval(timer);
            if (safety) clearTimeout(safety);
        };
    }, []);

    return (
        <div
            ref={bar}
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5 origin-left bg-brand opacity-0 transition-[transform,opacity] duration-200 ease-in-out"
            style={{ transform: 'scaleX(0)' }}
        />
    );
}
