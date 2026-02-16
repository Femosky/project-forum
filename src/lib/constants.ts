/**
 * Application-wide constants and configuration
 */

export const APP_NAME = 'Project Forum';
export const APP_DESCRIPTION =
    'A community-based forum to help get out the information and knowlegde of the Nigerian people on the web. Helping Nigerians share and get information pertinent to them.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const PASSWORD_SPECIAL_CHARACTERS = '!@#$%^&*';
export const PASSWORD_SPECIAL_CHARACTERS_REGEX = new RegExp(`[${PASSWORD_SPECIAL_CHARACTERS}]`);

export const IS_AUTHENTICATED_COOKIE_NAME = 'is_authenticated';
export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

// You can add more constants here as needed
// export const MAX_POST_LENGTH = 10000;
// export const MAX_COMMENT_LENGTH = 5000;
