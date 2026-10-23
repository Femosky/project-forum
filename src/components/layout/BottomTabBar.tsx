'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import { isActiveRoute, TAB_BAR_NAV } from '@/data/ui/navigation';

// Mobile only. The page reserves space for it with pb-tabbar on <main>.
export default function BottomTabBar() {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Tabs"
            className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        >
            <ul className="grid h-tabbar grid-cols-5">
                {TAB_BAR_NAV.map((route) => {
                    const Icon = route.icon;
                    const isActive = isActiveRoute(pathname, route.href);
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
                                <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
                                <span>{route.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
