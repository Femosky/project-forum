'use client';

import { useSyncExternalStore } from 'react';
import { CONSENT_COOKIE, CONSENT_VERSION } from './consentKeys';

// The reader's cookie choices, in one first-party cookie kept for a year:
//   cookie_consent=v1.a1.d0   (version 1, analytics on, advertising off)
// Strictly necessary cookies (sign-in, security, Turnstile, theme) need no choice. Analytics covers the
// cookieless page counts (PostHog and the site's own visitor stats): counted until someone says no. Advertising
// covers personalised AdSense and the Google Ads conversion tag: off until someone says yes. Bumping
// CONSENT_VERSION (consentKeys.ts) asks everyone again, after a policy change.

// The ads-only answer from before this banner: 'personalized' or 'limited'
const OLD_AD_CONSENT_COOKIE = 'ad_consent';
const YEAR_SECONDS = 365 * 24 * 60 * 60;

export type Consent = { analytics: boolean; ads: boolean };

const EVENT = 'consent-change';
export const OPEN_SETTINGS_EVENT = 'open-cookie-settings';

function cookie(name: string) {
    const row = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`));
    return row?.slice(name.length + 1);
}

let cached: { raw: string | undefined; value: Consent | null } | null = null;

// null until the reader has answered (this version)
export function readConsent(): Consent | null {
    const raw = cookie(CONSENT_COOKIE);
    if (cached && cached.raw === raw) return cached.value;
    const match = raw && /^v(\d+)\.a([01])\.d([01])$/.exec(raw);
    let value: Consent | null = match && Number(match[1]) === CONSENT_VERSION ? { analytics: match[2] === '1', ads: match[3] === '1' } : null;
    if (!raw) {
        // An answer to the old ads-only prompt carries over; analytics was never asked, so it stays on
        const old = cookie(OLD_AD_CONSENT_COOKIE);
        if (old === 'personalized' || old === 'limited') {
            value = { analytics: true, ads: old === 'personalized' };
            write(value);
            document.cookie = `${OLD_AD_CONSENT_COOKIE}=; path=/; max-age=0`;
        }
    }
    cached = { raw: cookie(CONSENT_COOKIE), value };
    return value;
}

function write(consent: Consent) {
    const value = `v${CONSENT_VERSION}.a${consent.analytics ? 1 : 0}.d${consent.ads ? 1 : 0}`;
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${YEAR_SECONDS}; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
    updateGoogleConsent(consent);
}

export function saveConsent(consent: Consent) {
    write(consent);
    window.dispatchEvent(new Event(EVENT));
}

// Google Consent Mode v2. The defaults (everything denied, or the saved answer) are set by an inline script in the
// layout before any Google script can load (CONSENT_DEFAULTS_SCRIPT below); this updates them on a choice.
type Gtag = (...args: unknown[]) => void;
export function updateGoogleConsent(consent: Consent) {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    const ads = consent.ads ? 'granted' : 'denied';
    gtag?.('consent', 'update', {
        ad_storage: ads,
        ad_user_data: ads,
        ad_personalization: ads,
        analytics_storage: consent.analytics ? 'granted' : 'denied',
    });
}

const subscribe = (onChange: () => void) => {
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
};

export const useConsent = () => useSyncExternalStore(subscribe, readConsent, () => null);

// Page counts run unless the reader turned analytics off
export const analyticsAllowed = () => readConsent()?.analytics !== false;

export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
