'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { setAdConsent } from './consent';

// Asks once, and only on pages with an AdSense slot (AdConsentGate decides when). Fixed to the bottom of the
// screen, so showing it moves nothing on the page.
export function AdConsentPrompt() {
    return (
        <div
            role="region"
            aria-label="Ad cookies"
            className="fixed inset-x-0 bottom-16 z-40 mx-auto flex max-w-content flex-col gap-3 border border-border bg-surface-raised p-4 text-sm shadow-raised sm:bottom-4 sm:rounded-xl md:flex-row md:items-center"
        >
            <p className="flex-1 text-muted">
                Ads help keep this site free. Our ad partner, Google, can use cookies to show ads that match your interests, or
                show general ads instead. <Link href="/policies/ads" className="font-semibold text-link hover:underline">Learn more</Link>
            </p>
            <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAdConsent('limited')}>
                    General ads only
                </Button>
                <Button size="sm" onClick={() => setAdConsent('personalized')}>
                    Allow
                </Button>
            </div>
        </div>
    );
}

export default AdConsentPrompt;
