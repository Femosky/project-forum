'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { OPEN_SETTINGS_EVENT, saveConsent, useConsent } from '@/lib/consent';
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
// opens the switches, and "Cookie settings" (footer, policies) reopens them later. When a certified consent
// platform (__tcfapi) is on the page, it asks instead and ours steps aside.
export default function CookieGate() {
    const [choosing, setChoosing] = useState(false);
    const consent = useConsent();

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const choice = (event.target as Element).closest?.('[data-consent-choice]')?.getAttribute('data-consent-choice');
            if (choice === 'choose') {
                markAnswered();
                setChoosing(true);
            } else if (choice) {
                saveConsent({ analytics: choice === 'accept', ads: choice === 'accept' });
                markAnswered();
            }
        };
        const reopen = () => setChoosing(true);
        document.addEventListener('click', onClick);
        window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
        // A consent platform loaded with the page gets a moment to appear
        const timer = setTimeout(() => typeof window.__tcfapi === 'function' && markAnswered(), 1000);
        return () => {
            document.removeEventListener('click', onClick);
            window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
            clearTimeout(timer);
        };
    }, []);

    // The Google Ads tag starts once advertising is allowed. Without NEXT_PUBLIC_GOOGLE_ADS_ID the build drops this
    // (and the loader module) entirely.
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID && consent?.ads) void import('@/lib/googleAds').then((tag) => tag.loadGoogleAds());
    }, [consent]);

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
                        saveConsent({ analytics, ads });
                        markAnswered();
                        setChoosing(false);
                    }}
                />
            </Suspense>
        </div>
    );
}
