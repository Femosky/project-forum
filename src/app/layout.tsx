import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION, APP_URL, REFRESH_TOKEN_COOKIE_NAME, SITE_LANG } from '@/lib/constants';
import { pageMetadata } from '@/lib/seo';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import BottomTabBar from '@/components/layout/BottomTabBar';
import { cookies } from 'next/headers';
import { AuthHydrator } from '@/lib/authHydrator';
import TopLoader from '@/components/common/TopLoader';
import SignInPrompt from '@/components/common/SignInPrompt';
import { NotificationPoller } from '@/components/notifications/NotificationBadge';
import AdConsentGate from '@/ads/AdConsentGate';
import PageViews from '@/components/common/PageViews';
import { getTheme } from '@/components/theme/getTheme';
import { getDataSaver } from '@/lib/dataSaver';

// Self-hosted at build time by next/font: no request to Google at runtime. "optional" means a slow first visit
// keeps the (size-matched) system font instead of swapping late: no repaint, no wait for 40 KB on a slow
// connection. The font is cached by the next page.
const nunito = Nunito({
    variable: '--font-nunito',
    subsets: ['latin'],
    weight: 'variable',
    display: 'optional',
});

// Search Console and Bing Webmaster Tools ownership tags, set from the deploy environment
const verification: Metadata['verification'] = {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
};

// Defaults for every page; pages override title, description, canonical and share tags with pageMetadata()
const defaults = pageMetadata({ title: APP_NAME, description: APP_DESCRIPTION, path: '/' });
export const metadata: Metadata = {
    ...defaults,
    // No og:url or canonical here: a page that doesn't set its own shouldn't claim to be the home page
    openGraph: { ...defaults.openGraph, url: undefined },
    // Relative canonical and og:image paths become absolute against this
    metadataBase: new URL(APP_URL),
    applicationName: APP_NAME,
    alternates: undefined,
    verification,
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0c1a2a' },
    ],
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Get the hasRefreshToken cookie from the cookie store
    const cookieStore = await cookies();
    const hasRefreshToken = cookieStore.has(REFRESH_TOKEN_COOKIE_NAME);
    const theme = await getTheme();
    const dataSaver = await getDataSaver();

    return (
        // data-theme is only set when the user picked a theme; otherwise CSS follows the system setting
        <html
            lang={SITE_LANG}
            data-theme={theme ?? undefined}
            data-save-data={dataSaver.enabled ? '' : undefined}
            className={nunito.variable}
            suppressHydrationWarning
        >
            <body>
                <TopLoader />
                <AuthHydrator isAuthenticated={hasRefreshToken} />

                <Header theme={theme} />

                {/* The document scrolls, not an inner container, so mobile URL bars collapse and back/forward restore position */}
                <div className="mx-auto flex w-full max-w-7xl">
                    <LeftSidebar />
                    <main className="min-w-0 flex-1 pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom))] md:pb-0">
                        {children}
                    </main>
                </div>

                <BottomTabBar />
                <SignInPrompt />
                <NotificationPoller />
                <AdConsentGate />
                <PageViews />
            </body>
        </html>
    );
}
