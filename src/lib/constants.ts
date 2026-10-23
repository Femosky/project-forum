/**
 * Application-wide constants and configuration
 */

export const APP_NAME = 'Project Forum';
export const APP_DESCRIPTION =
    'Ask questions, share what you know and get real answers from people who have been there.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const PASSWORD_SPECIAL_CHARACTERS = '!@#$%^&*';
export const PASSWORD_SPECIAL_CHARACTERS_REGEX = new RegExp(`[${PASSWORD_SPECIAL_CHARACTERS}]`);

export const IS_AUTHENTICATED_COOKIE_NAME = 'is_authenticated';
export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

// Theme the user picked; absent means follow the system setting
export const THEME_COOKIE_NAME = 'theme';
export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

// You can add more constants here as needed
// export const MAX_POST_LENGTH = 10000;
// export const MAX_COMMENT_LENGTH = 5000;
