import { useSyncExternalStore } from 'react';

// Shared bits for the menu and dialog layers (they replaced Radix, which cost ~35 KB on every page)

// False during SSR and hydration, true afterwards, so portals never cause a hydration mismatch
const noop = () => () => {};
export function useIsClient() {
    return useSyncExternalStore(noop, () => true, () => false);
}

// Page scroll is locked while a menu or dialog is open. The scrollbar's width goes back as padding so nothing shifts.
let locks = 0;
let saved: { overflow: string; paddingRight: string; pointerEvents: string } | null = null;

export function lockPage({ blockPointer }: { blockPointer: boolean }) {
    const body = document.body;
    if (locks++ === 0) {
        saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight, pointerEvents: body.style.pointerEvents };
        const gap = window.innerWidth - document.documentElement.clientWidth;
        const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
        body.style.overflow = 'hidden';
        if (gap > 0) body.style.paddingRight = `${padding + gap}px`;
    }
    // Clicks outside an open menu only close it, they don't reach what's underneath
    const previousPointer = body.style.pointerEvents;
    if (blockPointer) body.style.pointerEvents = 'none';

    return () => {
        if (blockPointer) body.style.pointerEvents = previousPointer;
        if (--locks === 0 && saved) {
            body.style.overflow = saved.overflow;
            body.style.paddingRight = saved.paddingRight;
            body.style.pointerEvents = saved.pointerEvents;
            saved = null;
        }
    };
}

const TABBABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function tabbables(container: HTMLElement) {
    return [...container.querySelectorAll<HTMLElement>(TABBABLE)].filter(
        (el) => !el.hasAttribute('disabled') && !el.closest('[hidden], [inert]') && el.getClientRects().length > 0
    );
}
