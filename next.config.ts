import type { NextConfig } from 'next';
import { CRAWLER_UA } from './src/lib/bots';
import { sentryEndpoint } from './src/lib/errorReport';

const nextConfig: NextConfig = {
    // Local testing on 127.0.0.1 (a second checkout runs there so its sign-in cookies don't mix with localhost's)
    allowedDevOrigins: ['127.0.0.1'],
    // Cached pages (the guest copies, app/guest) may be served up to 5 minutes past their 60 seconds while a fresh one
    // renders; Next's default would allow a year if re-rendering kept failing
    expireTime: 360,
    // Crawlers get metadata in <head> rather than streamed after it
    htmlLimitedBots: CRAWLER_UA,
    // Analytics events reach PostHog through the site's own origin (src/lib/analytics.ts)
    async rewrites() {
        const host = (process.env.POSTHOG_HOST || 'https://eu.i.posthog.com').replace(/\/$/, '');
        const rules = [{ source: '/_a/:path*', destination: `${host}/:path*` }];
        // Browser error reports reach Sentry the same way (src/lib/errorReport.ts)
        const sentry = sentryEndpoint();
        if (sentry) rules.push({ source: '/_e', destination: sentry });
        return rules;
    },
    // Private testing (PRIVATE_SITE=true): every response asks search engines not to index it
    async headers() {
        if (process.env.PRIVATE_SITE !== 'true') return [];
        return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
    },
    // Links shared before communities moved to /c/{name}
    async redirects() {
        return [
            { source: '/community/:name', destination: '/c/:name', permanent: true },
            { source: '/community/:name/replies/:shortId', destination: '/c/:name/:shortId', permanent: true },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                // port: '',
                // pathname: '',
                // search: '',
            },
        ],
    },
};

export default nextConfig;
