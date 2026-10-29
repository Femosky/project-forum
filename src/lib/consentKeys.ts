// Names shared by the consent code in the browser (consent.ts, CookieGate) and the inline script the layout prints
// (consentDefaults.ts). Kept apart so browser code doesn't pull the inline script's text into its bundle.
export const CONSENT_COOKIE = 'cookie_consent';
export const CONSENT_VERSION = 1;
// The <style> that hides the server-rendered cookie notice once the reader has answered
export const ANSWERED_STYLE_ID = 'cookie-answered';
export const ANSWERED_CSS = '.cookie-notice{display:none!important}';
