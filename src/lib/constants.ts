/**
 * Application-wide constants and configuration
 */

// Branding lives here: renaming the site means changing this block (the logo mark is drawn in src/app/_components/LogoSection.tsx). Page titles, share
// previews, generated images, structured data, robots.txt and llms.txt all read from it.
export const APP_NAME = 'Project Forum';
export const APP_DESCRIPTION =
    'Ask questions, share what you know and get real answers from people who have been there.';
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
// <html lang> and og:locale. English as written and searched in Nigeria; the copy itself stays neutral.
export const SITE_LANG = 'en-NG';
export const SITE_OG_LOCALE = 'en_NG';
// The site's X/Twitter account for twitter:site, e.g. '@projectforum'; left out until there is one
export const TWITTER_HANDLE = process.env.NEXT_PUBLIC_TWITTER_HANDLE || undefined;
// Colours for generated share images (match --accent and friends in globals.css)
export const BRAND_COLORS = { background: '#00203f', text: '#ffffff', accent: '#a29bff', muted: '#9fb6cc' } as const;
// What we call the score people earn from votes on their posts and replies (Reddit calls it karma). One word,
// used on profiles and share images; change it here to rename it everywhere.
export const REPUTATION_LABEL = 'reputation';
// Where legal requests, takedown notices and appeals go (shown on the policy pages)
export const LEGAL_EMAIL = process.env.NEXT_PUBLIC_LEGAL_EMAIL || 'legal@forum.oskeylabs.com';
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:3001';
export const THEME_STORAGE_KEY = 'theme';
// Runs before paint: a guest's stored theme, unless the server already set one from a cookie
export const THEME_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem('theme');if(!d.dataset.theme&&(t==='light'||t==='dark'))d.dataset.theme=t}catch(e){}`;

export const API_BASE = `${BACKEND_URL}/v1`;

export const PASSWORD_SPECIAL_CHARACTERS = '!@#$%^&*';
export const PASSWORD_SPECIAL_CHARACTERS_REGEX = new RegExp(`[${PASSWORD_SPECIAL_CHARACTERS}]`);

export const IS_AUTHENTICATED_COOKIE_NAME = 'is_authenticated';
export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

// Theme the user picked; absent means follow the system setting
export const THEME_COOKIE_NAME = 'theme';
export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

// "on" or "off" from the data saver switch in settings; absent means follow the browser's Save-Data setting
export const DATA_SAVER_COOKIE_NAME = 'data_saver';

// Limits the API enforces; the forms check them first
export const POST_TITLE_MIN = 3;
export const POST_TITLE_MAX = 300;
export const POST_BODY_MAX = 40000;
export const COMMENT_BODY_MAX = 10000;
