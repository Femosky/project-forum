import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
