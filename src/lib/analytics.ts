// Page views and shares, sent to PostHog through this site's own /_a path (a rewrite in next.config.ts) so there
// is no third-party script, no cookie and no storage. Each tab gets a random id that lives only in memory, so
// visits can't be followed from one day to the next; signed-in activity is counted by the API instead.
// Nothing is sent without NEXT_PUBLIC_POSTHOG_KEY, or when the browser asks not to be tracked.

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
let tabId: string | undefined;

function optedOut() {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    return nav.globalPrivacyControl === true || nav.doNotTrack === '1';
}

export function trackEvent(event: string, properties: Record<string, unknown> = {}) {
    if (!KEY || typeof window === 'undefined' || optedOut()) return;
    tabId ??= crypto.randomUUID();
    const body = JSON.stringify({
        api_key: KEY,
        event,
        distinct_id: tabId,
        properties: {
            ...properties,
            $current_url: location.origin + location.pathname,
            $pathname: location.pathname,
            $host: location.host,
            $process_person_profile: false,
        },
    });
    fetch('/_a/i/v0/e/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(
        () => undefined
    );
}
