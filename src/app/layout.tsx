import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION, IS_AUTHENTICATED_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '@/lib/constants';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import { cookies } from 'next/headers';
import { AuthHydrator } from '@/lib/authHydrator';

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
    // Get the isAuthenticated cookie from the cookie store
    const cookieStore = await cookies();
    const hasRefreshToken = cookieStore.has(REFRESH_TOKEN_COOKIE_NAME);

    return (
        <html lang="en">
            {/* <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body> */}
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AuthHydrator isAuthenticated={hasRefreshToken} />
                <Header />

                <div className="flex">
                    <LeftSidebar />
                    <main className="flex-1 borderborder-red-500">{children}</main>
                    {/* <RightSidebar /> */}
                </div>
            </body>
        </html>
    );
}
