import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION, REFRESH_TOKEN_COOKIE_NAME } from '@/lib/constants';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import BottomTabBar from '@/components/layout/BottomTabBar';
import { cookies } from 'next/headers';
import { AuthHydrator } from '@/lib/authHydrator';
import TopLoader from '@/components/common/TopLoader';
import SignInPrompt from '@/components/common/SignInPrompt';
import { getTheme } from '@/components/theme/getTheme';

// Self-hosted at build time by next/font: no request to Google at runtime
const nunito = Nunito({
    variable: '--font-nunito',
    subsets: ['latin'],
    weight: 'variable',
    display: 'swap',
});

export const metadata: Metadata = {
    title: APP_NAME,
    description: APP_DESCRIPTION,
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

    return (
        // data-theme is only set when the user picked a theme; otherwise CSS follows the system setting
        <html lang="en" data-theme={theme ?? undefined} className={nunito.variable} suppressHydrationWarning>
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
            </body>
        </html>
    );
}
