// The consent cookie's name and version live here (not in the client-only consent.ts) so the server can use them
export const CONSENT_COOKIE = 'cookie_consent';
export const CONSENT_VERSION = 1;

// Runs inline in <head> before anything else: Google Consent Mode v2 defaults. Everything is denied until the
// reader says yes; a saved answer is applied at once, so returning readers' ads load with the right settings.
// It also marks <html data-consent> when the reader has answered (or answered the old ads-only prompt), which hides
// the cookie notice before the first paint. Kept tiny and dependency-free; it is part of every page's HTML, not the
// JS bundle.
export const CONSENT_DEFAULTS_SCRIPT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
var m=document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=v${CONSENT_VERSION}\\.a([01])\\.d([01])/),d=m&&m[2]==='1'?'granted':'denied';
gtag('consent','default',{ad_storage:d,ad_user_data:d,ad_personalization:d,analytics_storage:m&&m[1]==='1'?'granted':'denied',wait_for_update:500});
gtag('set','ads_data_redaction',d==='denied');
if(m||/(?:^|; )ad_consent=/.test(document.cookie))document.documentElement.setAttribute('data-consent','');`;
