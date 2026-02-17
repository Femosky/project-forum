import { UserSection } from '@/app/_components/UserSection';
import { SearchSection } from '@/app/_components/SearchSection';
import LogoSection from '@/app/_components/LogoSection';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

type HeaderProps = ComponentProps<'header'>;

export default function Header({ className, ...props }: HeaderProps) {
    return (
        <header
            className={twMerge(
                'w-full h-header-height flex items-center justify-between p-4 border-b border-gray-200 gap-4',
                className
            )}
            {...props}
        >
            {/* Logo Section */}
            <div className="shrink-0">
                <LogoSection />
            </div>

            {/* Search Section */}
            <div className="flex-1 max-w-[45%]">
                <SearchSection />
            </div>

            {/* User Section */}
            <div className="shrink-0">
                <UserSection />
            </div>
        </header>
    );
}
