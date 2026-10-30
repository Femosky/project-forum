'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
import { analyticsAllowed } from '@/lib/consent';
import { API_BASE } from '@/lib/constants';

// One $pageview per path, including client-side navigations. Query strings are left out (search terms are
// counted by the API), and the referrer is reduced to its site. The same moment tells the API about the visit for
// the site's own stats (Admin -> Stats): sent from the browser, so pages served from the CDN cache count too.
// Both are cookieless, and both stop when the reader turns analytics off in the cookie banner.
export default function PageViews() {
    const pathname = usePathname();

    useEffect(() => {
        if (!analyticsAllowed()) return;
        // Plain text keeps it a "simple" request: no CORS preflight, and it survives the page closing
        fetch(`${API_BASE}/metrics/visit`, {
            method: 'POST',
            credentials: 'include',
            keepalive: true,
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ path: location.pathname.slice(0, 300) }),
        }).catch(() => undefined);
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
