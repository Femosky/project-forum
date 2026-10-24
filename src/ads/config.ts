import { API_BASE } from '@/lib/constants';
import type { AdPlacement } from './types';

// Where ads go, in one place. Feed: after the 3rd post, then after every 8 more. Thread: after the 2nd top-level
// comment, then after every 10 more.
export const AD_RULES: Record<AdPlacement, { first: number; every: number }> = {
    feed: { first: 3, every: 8 },
    thread: { first: 2, every: 10 },
};

// Reserved heights for AdSense slots, so nothing moves when the ad arrives (CLS stays at zero)
export const ADSENSE_HEIGHT: Record<AdPlacement, number> = { feed: 280, thread: 250 };

// The slot number (0, 1, 2...) that follows the item at this index, or null when no slot follows it
export function slotAfter(index: number, placement: AdPlacement): number | null {
    const { first, every } = AD_RULES[placement];
    const position = index + 1 - first;
    if (position < 0 || position % every !== 0) return null;
    return position / every;
}

// How many slots a list of `length` items holds, counted from item `offset` onward
export function slotsBetween(offset: number, length: number, placement: AdPlacement): number {
    let count = 0;
    for (let index = offset; index < offset + length; index++) if (slotAfter(index, placement) !== null) count++;
    return count;
}

export const adClickUrl = (id: string) => `${API_BASE}/ads/click/${id}`;

// Cookies on the web app's own domain
export const AD_SEEN_COOKIE = 'ad_seen';
export const AD_CONSENT_COOKIE = 'ad_consent';
