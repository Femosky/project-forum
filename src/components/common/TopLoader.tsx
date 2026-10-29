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
        let running = false;
        let safety: ReturnType<typeof setTimeout> | null = null;
        let hide: ReturnType<typeof setTimeout> | null = null;
        const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

        const set = (transition: string, scale: number, opacity: number) => {
            element.style.transition = transition;
            element.style.transform = `scaleX(${scale})`;
            element.style.opacity = String(opacity);
        };
        // One long eased transition does the trickle: smooth on the compositor, no timers stepping the bar along.
        // It slows as it nears 90% and never gets there on its own.
        const start = () => {
            if (running) return;
            running = true;
            if (hide) clearTimeout(hide);
            // Something may still cancel the navigation (a handler further down, a blocked route), so a bar that is
            // still running after a while finishes on its own
            safety = setTimeout(done, 10_000);
            set('none', 0, 1);
            void element.offsetWidth; // start from zero before animating
            set(reduced() ? 'none' : 'transform 8s cubic-bezier(0.08, 0.7, 0.2, 1)', reduced() ? 0.5 : 0.9, 1);
        };
        const done = () => {
            if (!running) return;
            running = false;
            if (safety) clearTimeout(safety);
            set(reduced() ? 'opacity 150ms' : 'transform 200ms ease-out, opacity 250ms ease 200ms', 1, 0);
            hide = setTimeout(() => !running && set('none', 0, 0), 500);
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
            if (safety) clearTimeout(safety);
            if (hide) clearTimeout(hide);
        };
    }, []);

    return (
        <div
            ref={bar}
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5 origin-left bg-brand opacity-0 will-change-transform"
            style={{ transform: 'scaleX(0)' }}
        />
    );
}
