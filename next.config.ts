import type { NextConfig } from 'next';
import { CRAWLER_UA } from './src/lib/bots';
import { sentryEndpoint } from './src/lib/errorReport';

const nextConfig: NextConfig = {
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
