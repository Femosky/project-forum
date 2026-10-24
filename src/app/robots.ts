import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/constants';

// Search engines and AI crawlers are all welcome (being in AI answers is part of the point). They get the same
// rules; naming the AI crawlers just makes that explicit, since a named group replaces "*" for that bot.
const AI_CRAWLERS = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
    'CCBot',
    'Meta-ExternalAgent',
    'Amazonbot',
    'DuckAssistBot',
    'MistralAI-User',
];

// Personal pages, forms and endless search results
const DISALLOW = ['/submit', '/ads/', '/settings', '/saved', '/notifications', '/profile', '/auth/', '/search?', '/v1/', '/api/'];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            { userAgent: '*', allow: '/', disallow: DISALLOW },
            { userAgent: AI_CRAWLERS, allow: '/', disallow: DISALLOW },
        ],
        sitemap: `${APP_URL}/sitemap.xml`,
    };
}
