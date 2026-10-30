# Deploying the web app

Private testing runs on **Vercel Hobby** (free) at `https://forum.oskeylabs.com`, talking to the API at `https://api.forum.oskeylabs.com` (see `docs/DEPLOY.md` in the API repo). Functions run in `fra1` (Frankfurt, `vercel.json`), next to the API and database once they move to Frankfurt (project-root `docs/LAUNCH.md`, "Moving to Frankfurt"). Until that move they sat in `cle1` (Cleveland), next to Ohio.

Vercel Hobby is for non-commercial use. Before ads go live, move to Vercel Pro or to Cloudflare (docs/ROADMAP.md, decision 5).

## How a deploy happens

Vercel's GitHub integration builds every push. `main` goes to production; every PR gets its own preview URL (Vercel marks previews `noindex` by itself). Previews live on `*.vercel.app`, so sign-in cookies from the API don't reach them: use them to check pages, not accounts. CI (typecheck, lint, build, page-weight budget and Lighthouse) runs on GitHub as before.

## One-time setup

1. vercel.com → Add New → Project → import `Femosky/project-forum`. Framework is detected; leave build settings alone.
2. Add the variables below for **Production** (and Preview if you like), then deploy.
3. Project → Settings → Domains → add `forum.oskeylabs.com`. At the DNS host add a CNAME `forum` → `cname.vercel-dns.com` (on Cloudflare, **DNS only**, grey cloud).
4. Settings → Billing has no spend on Hobby; nothing to cap.

## Settings

`NEXT_PUBLIC_*` values are baked in at build time, so change them and redeploy.

| Variable | Value for testing | Notes |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_API` | `https://api.forum.oskeylabs.com` | No `/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://forum.oskeylabs.com` | Canonical links, sitemaps, share cards |
| `NEXT_PUBLIC_LEGAL_EMAIL` | an address that reaches you | Shown on every policy page. `legal@forum.oskeylabs.com` works once email forwarding is set up (Cloudflare Email Routing is free) |
| `PRIVATE_SITE` | `true` | robots.txt blocks every crawler and every page is sent `noindex`. Remove at public launch |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key (EU) | Page views and shares. Same project as the API's `POSTHOG_API_KEY` |
| `POSTHOG_HOST` | leave unset | Defaults to `https://eu.i.posthog.com` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | The bot check on signup, password reset, repeated failed logins and a new account's first posts. Set it together with the API's `TURNSTILE_SECRET_KEY`. Vercel type: Config |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project DSN | Error alerts from browsers and the server, sent through `/_e` without the Sentry SDK (`src/lib/errorReport.ts`). Vercel type: Config |
| `NEXT_PUBLIC_TWITTER_HANDLE` | when there is an account | |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | `AW-...`, when you run Google Ads campaigns | Conversion tracking for sign-ups and new posts. Unset = no Google tag at all. It loads only after a reader allows advertising cookies, never with data saver, once the page is idle. Vercel type: Config |
| `NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL`, `NEXT_PUBLIC_GOOGLE_ADS_POST_LABEL` | with the id above | Each conversion action's label (Google Ads → Goals → Conversions → the action → Tag setup → "send_to": `AW-.../LABEL`) |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | at public launch | The `content` value of each verification meta tag |
| `INDEXNOW_KEY` | at public launch | Same value as the API's |

## Guest page caching

Logged-out visitors to `/`, `/trending`, `/c/{name}` and post pages get HTML that is the same for every guest, so `src/proxy.ts` marks it `Vercel-CDN-Cache-Control: public, s-maxage=60, stale-while-revalidate=300`: Vercel's CDN keeps it for a minute and serves it stale for five more while it re-renders. Browsers get `Cache-Control: public, max-age=0, must-revalidate` and the response carries `X-Guest-Cache: <variant>`. Requests with sign-in cookies are never cached (Next's `private, no-store`), and guest copies are keyed separately per theme and data-saver setting (`?__guest=` on the internal rewrite). Guest HTML contains nothing personal, so even a cache mistake could only show someone the signed-out page. Ads in cached pages ignore the per-reader frequency cookie for up to a minute.

To check after a deploy: `curl -sI https://forum.oskeylabs.com/trending | grep -i -E 'x-vercel-cache|cache-control|x-guest'` twice (the second says `x-vercel-cache: HIT`), then the same with `-H 'Cookie: refresh_token=x'` (no `X-Guest-Cache`, `private, no-store`).

## Cookies and consent

Every new visitor gets the cookie banner (`src/components/consent`): Accept all, Reject all, or Choose (strictly necessary always on; analytics, on unless turned off; advertising, off until allowed). The answer is `cookie_consent=v1.a1.d0` for a year; bump `CONSENT_VERSION` in `src/lib/consentDefaults.ts` to ask everyone again after a policy change. An inline script sets Google Consent Mode v2 defaults (all denied) before any Google script. When an IAB TCF consent platform is on the page (`__tcfapi`, e.g. Google's own "Privacy & messaging" message), the banner stays away. **EEA/UK visitors**: Google requires a Google-certified consent platform to serve AdSense there; once AdSense approves the site, turn on AdSense → Privacy & messaging → European regulations message (free) and ours steps aside.

## Analytics

`src/lib/analytics.ts` sends `$pageview` (path only, no query string; referrer reduced to its site) and `share` (`channel`: native, whatsapp, x, facebook, telegram, copy_link) to `/_a/...`, which `next.config.ts` rewrites to PostHog. That keeps it first-party and adds well under 1 KB of JavaScript. There is no cookie or storage; each tab gets an id held in memory, and nothing is sent when the browser signals Do Not Track or Global Privacy Control. Signups, posts, comments, votes, searches and return visits are counted by the API.

Suggested PostHog dashboard ("Launch"): Trends of `$pageview`, `signup`, `post_created`, `comment_created`, `vote`; `share` broken down by `channel`; `search` where `no_results = true` broken down by `query` (threads to seed); Retention with first event `signup` and return event `user_active` (D1/D7/D30).

## Renaming

The name and colours live in one block at the top of `src/lib/constants.ts` (the logo mark is drawn in `src/app/_components/LogoSection.tsx`, with matching `src/app/favicon.ico`, `icon.png` and `apple-icon.png`). When the site moves to its own domain, change `NEXT_PUBLIC_APP_URL`, add the domain in Vercel, and update the API's `WEB_ORIGIN`, `WEB_URL`, `COOKIE_DOMAIN` and `EMAIL_FROM`.
