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
        let safety: ReturnType<typeof setTimeout> | undefined;
        const set = (transition: string, scale: number, opacity: number) => {
            element.style.transition = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : transition;
            element.style.transform = `scaleX(${scale})`;
            element.style.opacity = String(opacity);
        };
        // One long eased transition does the trickle: smooth on the compositor, no timers stepping the bar along.
        // It slows as it nears 90% and never gets there on its own. Reduced motion: the bar just appears.
        const start = () => {
            if (running) return;
            running = true;
            // Something may still cancel the navigation (a handler further down, a blocked route), so a bar that is
            // still running after a while finishes on its own
            safety = setTimeout(done, 10_000);
            set('none', 0, 1);
            void element.offsetWidth; // start from zero before animating
            set('transform 8s cubic-bezier(.08,.7,.2,1)', 0.9, 1);
        };
        // A quick finish, then a fade
        const done = () => {
            if (!running) return;
            running = false;
            clearTimeout(safety);
            set('transform .2s ease-out,opacity .25s ease .2s', 1, 0);
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
            clearTimeout(safety);
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
