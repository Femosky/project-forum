'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { readConsent, saveConsent } from '@/lib/consent';
import { ANSWERED_CSS, ANSWERED_STYLE_ID } from '@/lib/consentKeys';

// The per-purpose switches only download when someone asks to choose
const CookieChoices = lazy(() => import('./CookieChoices'));

declare global {
    interface Window {
        // An IAB TCF consent platform (for example Google's own "Privacy & messaging" message in AdSense)
        __tcfapi?: unknown;
    }
}

// Hides the server-rendered notice once there's an answer, the same way the inline consent script does on later
// visits: a <style> in <head>, which survives React re-rendering the layout
function markAnswered() {
    if (document.getElementById(ANSWERED_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = ANSWERED_STYLE_ID;
    style.textContent = ANSWERED_CSS;
    document.head.appendChild(style);
}

// Makes the cookie notice (CookieNotice, in the page HTML) work: Accept all and Reject all answer at once, Choose
// opens the switches, and "Cookie settings" (footer, policies: the same data-consent-choice="choose") reopens them.
// It also starts the Google Ads tag once advertising is allowed; without NEXT_PUBLIC_GOOGLE_ADS_ID the build drops
// that (and the loader module) entirely. When a certified consent
// platform (__tcfapi) is on the page, it asks instead and ours steps aside.
function startAdsTag() {
    if (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) void import('@/lib/googleAds').then((tag) => tag.loadGoogleAds());
}

function answer(analytics: boolean, ads: boolean) {
    saveConsent({ analytics, ads });
    markAnswered();
    if (ads) startAdsTag();
}

export default function CookieGate() {
    const [choosing, setChoosing] = useState(false);

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const choice = (event.target as Element).closest?.('[data-consent-choice]')?.getAttribute('data-consent-choice');
            if (choice === 'choose') {
                markAnswered();
                setChoosing(true);
            } else if (choice) {
                answer(choice === 'accept', choice === 'accept');
            }
        };
        if (readConsent()?.ads) startAdsTag();
        document.addEventListener('click', onClick);
        // A consent platform loaded with the page gets a moment to appear
        const timer = setTimeout(() => typeof window.__tcfapi === 'function' && markAnswered(), 1000);
        return () => {
            document.removeEventListener('click', onClick);
            clearTimeout(timer);
        };
    }, []);

    if (!choosing) return null;
    return (
        <div
            role="region"
            aria-label="Cookie settings"
            className="fixed inset-x-0 bottom-16 z-50 mx-auto max-w-content border border-border bg-surface-raised p-4 text-sm shadow-raised sm:bottom-4 sm:rounded-xl"
        >
            <Suspense fallback={<div className="h-48" />}>
                <CookieChoices
                    onSave={(analytics, ads) => {
                        answer(analytics, ads);
                        setChoosing(false);
                    }}
                />
            </Suspense>
        </div>
    );
}
