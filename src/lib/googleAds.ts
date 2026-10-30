'use client';

import { readConsent } from './consent';

// Google Ads conversion tracking (sign-ups and new posts), for measuring the site's own ad campaigns. Off unless
// NEXT_PUBLIC_GOOGLE_ADS_ID (AW-...) is set. gtag.js loads only after the reader allowed advertising cookies, never
// with data saver on, and only once the page is idle, so it never competes with the page itself.
// Consent Mode defaults are set by the inline script in the layout (lib/consentDefaults.ts).

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
// Conversion labels from Google Ads (Goals -> Conversions -> the action -> Tag setup), e.g. "AbCdEfGh123"
const LABELS = {
    sign_up: process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL,
    post_created: process.env.NEXT_PUBLIC_GOOGLE_ADS_POST_LABEL,
};

type Gtag = (...args: unknown[]) => void;
const gtag: Gtag = (...args) => (window as unknown as { gtag?: Gtag }).gtag?.(...args);

let loaded = false;

export function loadGoogleAds() {
    if (!ADS_ID || loaded || document.documentElement.hasAttribute('data-save-data') || !readConsent()?.ads) return;
    loaded = true;
    const run = () => {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ADS_ID)}`;
        document.head.appendChild(script);
        gtag('js', new Date());
        gtag('config', ADS_ID);
    };
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 4000 });
    else setTimeout(run, 2000);
}

// A conversion happened. Queued in dataLayer, so it is sent once gtag.js arrives; dropped when the tag is off.
export function trackConversion(kind: keyof typeof LABELS) {
    const label = LABELS[kind];
    if (!ADS_ID || !label || !readConsent()?.ads) return;
    loadGoogleAds();
    gtag('event', 'conversion', { send_to: `${ADS_ID}/${label}` });
}
