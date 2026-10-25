import { UserSection } from '@/app/_components/UserSection';
import { SearchSection } from '@/app/_components/SearchSection';
import LogoSection from '@/app/_components/LogoSection';
import ThemeMenu from '@/components/theme/ThemeMenu';
import NotificationBell from '@/components/notifications/NotificationBell';
import MobileNav from './MobileNav';
import { Theme } from '@/lib/constants';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

type HeaderProps = ComponentProps<'header'> & { theme: Theme | null };

export default function Header({ className, theme, ...props }: HeaderProps) {
    return (
        <header
            className={twMerge(
                // Phones and small tablets only; on desktop the sidebar carries the logo, search and account
                'sticky top-0 z-40 h-header w-full border-b border-border bg-bar backdrop-blur-xl backdrop-saturate-150 md:hidden',
                className
            )}
            {...props}
        >
            <div className="flex h-full items-center gap-2 px-3 sm:gap-4 sm:px-4">
                <div className="flex shrink-0 items-center gap-1">
                    <MobileNav />
                    <LogoSection />
                </div>

                <div className="flex flex-1 justify-end md:justify-center">
                    <SearchSection />
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <ThemeMenu initialTheme={theme} />
                    <NotificationBell />
                    <UserSection />
                </div>
            </div>
        </header>
    );
}
