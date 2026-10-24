'use client';

import { useSyncExternalStore } from 'react';
import { AD_CONSENT_COOKIE } from './config';

// The reader's answer about ad cookies: 'personalized' or 'limited' (AdSense then serves non-personalised ads).
// AdSense loads only after an answer. Stored for a year in a first-party cookie.

export type AdConsent = 'personalized' | 'limited';

const EVENT = 'ad-consent-change';
const ASKED = 'ad-consent-asked';

function read(): AdConsent | null {
    const row = document.cookie.split('; ').find((item) => item.startsWith(`${AD_CONSENT_COOKIE}=`));
    const value = row?.slice(AD_CONSENT_COOKIE.length + 1);
    return value === 'personalized' || value === 'limited' ? value : null;
}

export function setAdConsent(value: AdConsent) {
    document.cookie = `${AD_CONSENT_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event(EVENT));
}

const subscribe = (onChange: () => void) => {
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
};

export const useAdConsent = () => useSyncExternalStore(subscribe, read, () => null);

// An AdSense slot on the page wants an answer; the prompt in the layout shows itself
let asked = false;
export function askForAdConsent() {
    if (asked) return;
    asked = true;
    window.dispatchEvent(new Event(ASKED));
}

export const useAdConsentAsked = () =>
    useSyncExternalStore(
        (onChange) => {
            window.addEventListener(ASKED, onChange);
            return () => window.removeEventListener(ASKED, onChange);
        },
        () => asked,
        () => false
    );
