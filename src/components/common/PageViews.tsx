'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

// One $pageview per path, including client-side navigations. Query strings are left out (search terms are
// counted by the API), and the referrer is reduced to its site.
export default function PageViews() {
    const pathname = usePathname();

    useEffect(() => {
        let referrer: string | undefined;
        try {
            referrer = document.referrer ? new URL(document.referrer).host : undefined;
        } catch {
            // Not a URL
        }
        trackEvent('$pageview', { $referring_domain: referrer && referrer !== location.host ? referrer : undefined });
    }, [pathname]);

    return null;
}
