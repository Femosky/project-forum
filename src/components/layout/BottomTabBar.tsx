'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import { isActiveRoute, TAB_BAR_NAV } from '@/data/ui/navigation';
import { UnreadBadge } from '@/components/notifications/NotificationBadge';

// Mobile only. The page reserves space for it with pb-tabbar on <main>.
export default function BottomTabBar() {
    const pathname = usePathname();

    // Icon-only and frosted, like the tab bars in Apple's own apps; New post is the one outlined button in the middle
    return (
        <nav
            aria-label="Tabs"
            className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bar backdrop-blur-xl backdrop-saturate-150 pb-[env(safe-area-inset-bottom)]"
        >
            <ul className="grid h-tabbar grid-cols-5">
                {TAB_BAR_NAV.map((route) => {
                    const Icon = route.icon;
                    const isActive = isActiveRoute(pathname, route.href);
                    const isCreate = route.href === '/submit';
                    return (
                        <li key={route.href} className="flex items-center justify-center">
                            <Link
                                href={route.href}
                                aria-label={route.label}
                                aria-current={isActive ? 'page' : undefined}
                                className={twMerge(
                                    'flex items-center justify-center transition-colors',
                                    isCreate
                                        ? 'h-9 w-12 rounded-xl text-text ring-1 ring-inset ring-border-strong hover:bg-hover'
                                        : twMerge('size-11', isActive ? 'text-text' : 'text-subtle hover:text-text')
                                )}
                            >
                                <span className="relative">
                                    <Icon className="size-[22px]" strokeWidth={isActive || isCreate ? 2.25 : 1.75} />
                                    {route.href === '/notifications' && <UnreadBadge className="-right-2" />}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
