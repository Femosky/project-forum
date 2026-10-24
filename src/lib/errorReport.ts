// Error alerts to Sentry (free tier) as plain HTTP "envelopes": the Sentry SDK would add far more JavaScript than the
// page budget allows. Browsers send through this site's /_e path (a rewrite in next.config.ts, so ad blockers and
// CORS don't get in the way); the server sends straight to Sentry. Without NEXT_PUBLIC_SENTRY_DSN nothing is sent.

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// https://KEY@HOST/PROJECT → the envelope endpoint, or null for a missing or malformed DSN
export function sentryEndpoint(dsn = DSN): string | null {
    if (!dsn) return null;
    try {
        const { protocol, username, host, pathname } = new URL(dsn);
        const project = pathname.replace(/^\//, '');
        return username && project ? `${protocol}//${host}/api/${project}/envelope/?sentry_key=${username}&sentry_version=7` : null;
    } catch {
        return null;
    }
}

let sent = 0;

export function reportError(error: unknown, context: { runtime: 'browser' | 'server'; path?: string; digest?: string }) {
    const endpoint = context.runtime === 'browser' ? '/_e' : sentryEndpoint();
    // A page that keeps failing sends a handful, not hundreds
    if (!DSN || !endpoint || sent >= 10) return;
    sent++;

    const err = error instanceof Error ? error : new Error(String(error));
    const eventId = crypto.randomUUID().replace(/-/g, '');
    const event = {
        event_id: eventId,
        timestamp: Date.now() / 1000,
        platform: 'javascript',
        level: 'error',
        environment: process.env.NODE_ENV,
        release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
        transaction: context.path,
        tags: { runtime: context.runtime, digest: context.digest },
        exception: { values: [{ type: err.name, value: err.message.slice(0, 1000) }] },
        extra: { stack: err.stack?.slice(0, 8000) },
        request: context.runtime === 'browser' ? { headers: { 'User-Agent': navigator.userAgent } } : undefined,
    };
    const body = [JSON.stringify({ event_id: eventId, dsn: DSN }), JSON.stringify({ type: 'event' }), JSON.stringify(event)].join('\n');
    fetch(endpoint, { method: 'POST', body, keepalive: true }).catch(() => undefined);
}
