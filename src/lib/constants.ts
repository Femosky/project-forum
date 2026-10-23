/**
 * Application-wide constants and configuration
 */

export const APP_NAME = 'Project Forum';
export const APP_DESCRIPTION =
    'Ask questions, share what you know and get real answers from people who have been there.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:3001';
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

// Limits the API enforces; the forms check them first
export const POST_TITLE_MIN = 3;
export const POST_TITLE_MAX = 300;
export const POST_BODY_MAX = 40000;
export const COMMENT_BODY_MAX = 10000;
