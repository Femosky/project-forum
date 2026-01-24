import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import { AuthStateProvider } from '@/contexts/AuthState';

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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            {/* <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body> */}
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AuthStateProvider>
                    <Header />

                    <div className="flex">
                        <LeftSidebar />
                        {children}
                        {/* <RightSidebar /> */}
                    </div>
                </AuthStateProvider>
            </body>
        </html>
    );
}
