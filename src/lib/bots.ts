// Crawlers and link-preview fetchers. They get a fully blocking render (metadata in <head>, see next.config.ts)
// and real 301/404/410 status codes from the proxy. Next's default list plus Googlebot and the AI crawlers that
// robots.txt welcomes.
export const CRAWLER_UA =
    /Googlebot|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|DuckAssistBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|meta-externalagent|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|SkypeUriPreview|Yeti|googleweblight|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|Claude-User|PerplexityBot|Perplexity-User|CCBot|Amazonbot|MistralAI-User/i;
