'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import { isActiveRoute, TAB_BAR_NAV } from '@/data/ui/navigation';
import { UnreadBadge } from '@/components/notifications/NotificationBadge';

// Mobile only. The page reserves space for it with pb-tabbar on <main>.
export default function BottomTabBar() {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Tabs"
            className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        >
            <ul className="grid h-tabbar grid-cols-5">
                {TAB_BAR_NAV.map((route) => {
                    const Icon = route.icon;
                    const isActive = isActiveRoute(pathname, route.href);
                    // Create is the one solid button in the bar
                    if (route.href === '/submit') {
                        return (
                            <li key={route.href} className="flex items-center justify-center">
                                <Link
                                    href={route.href}
                                    aria-label={route.label}
                                    aria-current={isActive ? 'page' : undefined}
                                    className="flex h-9 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg transition-colors hover:bg-accent-hover"
                                >
                                    <Icon className="size-5" strokeWidth={2.5} />
                                </Link>
                            </li>
                        );
                    }
                    return (
                        <li key={route.href}>
                            <Link
                                href={route.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={twMerge(
                                    'flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors',
                                    isActive ? 'text-text' : 'text-muted hover:text-text'
                                )}
                            >
                                <span className="relative">
                                    <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
                                    {route.href === '/notifications' && <UnreadBadge className="-right-2" />}
                                </span>
                                <span>{route.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
