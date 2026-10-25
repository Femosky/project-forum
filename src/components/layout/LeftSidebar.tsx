import { ComponentProps } from 'react';
import Link from 'next/link';
import { Search, SquarePen } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import SidebarList from '@/components/common/SidebarList';
import LogoSection from '@/app/_components/LogoSection';
import SidebarAccount from './SidebarAccount';
import { APP_NAME, Theme } from '@/lib/constants';

type LeftSidebarProps = ComponentProps<'aside'> & { theme: Theme | null };

// Desktop only (it replaces the top header there); on small screens the same list lives in the header's slide-out
// menu. Logo and new post, search, navigation and communities, then the account at the bottom.
export default function LeftSidebar({ className, theme, ...props }: LeftSidebarProps) {
    return (
        <aside
            className={twMerge(
                'sticky top-0 hidden h-dvh w-sidebar shrink-0 flex-col gap-3 overflow-y-auto border-r border-border py-3 pl-4 pr-2 md:flex',
                className
            )}
            {...props}
        >
            <div className="flex items-center justify-between gap-2 pl-1">
                <LogoSection />
                <Link
                    href="/submit"
                    aria-label="New post"
                    title="New post"
                    className="flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-text"
                >
                    <SquarePen className="size-4" />
                </Link>
            </div>

            {/* A plain GET form, so search works before scripts load */}
            <form action="/search" role="search" className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                <input
                    type="search"
                    name="q"
                    aria-label={`Search ${APP_NAME}`}
                    placeholder="Search"
                    className="h-8 w-full rounded-md bg-transparent pl-8 pr-2 text-sm text-text placeholder:text-subtle outline-none transition-colors hover:bg-hover focus:bg-hover"
                />
            </form>

            <SidebarList />

            <div className="mt-auto">
                <SidebarAccount initialTheme={theme} />
            </div>
        </aside>
    );
}
