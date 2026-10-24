'use client';

import { useAdConsent, useAdConsentAsked } from './consent';
import AdConsentPrompt from './AdConsentPrompt';

// Shows the ad-cookie prompt once a page with an AdSense slot asks for it, until the reader answers
export function AdConsentGate() {
    const consent = useAdConsent();
    const asked = useAdConsentAsked();
    return asked && !consent ? <AdConsentPrompt /> : null;
}

export default AdConsentGate;
