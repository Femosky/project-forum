import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION, REFRESH_TOKEN_COOKIE_NAME } from '@/lib/constants';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import { cookies } from 'next/headers';
import { AuthHydrator } from '@/lib/authHydrator';
import TopLoader from '@/components/common/TopLoader';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: APP_NAME,
    description: APP_DESCRIPTION,
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Get the hasRefreshToken cookie from the cookie store
    const cookieStore = await cookies();
    const hasRefreshToken = cookieStore.has(REFRESH_TOKEN_COOKIE_NAME);

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}>
                <TopLoader />
                <AuthHydrator isAuthenticated={hasRefreshToken} />

                <Header className="z-50 fixed h-(--header-height) bg-white" />
                <LeftSidebar className="z-10 hidden md:block fixed top-(--header-height) left-0 h-[calc(100vh-var(--header-height))] w-(--left-sidebar-width) overflow-y-auto bg-white" />

                <div
                    className={`z-1 absolute top-(--header-height) left-0 md:left-(--left-sidebar-width) right-0 bottom-0 h-[calc(100vh-4rem)]`}
                >
                    <main className="">{children}</main>
                </div>
            </body>
        </html>
    );
}
