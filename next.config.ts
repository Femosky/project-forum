import type { NextConfig } from 'next';
import { CRAWLER_UA } from './src/lib/bots';

const nextConfig: NextConfig = {
    // Crawlers get metadata in <head> rather than streamed after it
    htmlLimitedBots: CRAWLER_UA,
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
