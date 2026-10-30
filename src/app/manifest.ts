import type { MetadataRoute } from 'next';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/constants';

// So the site can be added to a home screen, which is what lets iPhones receive its notifications
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: APP_NAME,
        short_name: APP_NAME,
        description: APP_DESCRIPTION,
        start_url: '/',
        display: 'standalone',
        background_color: '#0f1012',
        theme_color: '#0f1012',
        icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
    };
}
