'use client';

import { useEffect, type RefObject } from 'react';
import { API_BASE } from '@/lib/constants';
import { recordSeen } from './frequency';
import type { NativeAdUnit } from './types';

// Viewable impressions for native ads: counted once per page view when at least half the card has been on screen
// for a second (the IAB definition). Ids are batched and sent every few seconds, and when the page is hidden.

const queue: string[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (queue.length === 0) return;
    const impressions = queue.splice(0, 50);
    // text/plain keeps this a "simple" cross-origin request (no preflight); keepalive lets it outlive the page
    fetch(`${API_BASE}/ads/events`, {
        method: 'POST',
        body: JSON.stringify({ impressions }),
        headers: { 'Content-Type': 'text/plain' },
        credentials: 'omit',
        keepalive: true,
    }).catch(() => {});
    if (queue.length > 0) flush();
}

function enqueue(id: string) {
    queue.push(id);
    if (queue.length >= 50) flush();
    else timer ??= setTimeout(flush, 5000);
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
}

export function useAdImpression(ref: RefObject<HTMLElement | null>, unit: NativeAdUnit, enabled = true) {
    useEffect(() => {
        const element = ref.current;
        if (!element || !enabled) return;
        let visibleTimer: ReturnType<typeof setTimeout> | null = null;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    visibleTimer ??= setTimeout(() => {
                        observer.disconnect();
                        enqueue(unit.id);
                        if (unit.frequency_cap) recordSeen(unit.campaign_id);
                    }, 1000);
                } else if (visibleTimer) {
                    clearTimeout(visibleTimer);
                    visibleTimer = null;
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(element);
        return () => {
            observer.disconnect();
            if (visibleTimer) clearTimeout(visibleTimer);
        };
    }, [ref, enabled, unit.id, unit.campaign_id, unit.frequency_cap]);
}
