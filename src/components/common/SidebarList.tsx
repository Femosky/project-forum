'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { DividerLine } from '../ui/DividerLine';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { api } from '@/lib/api/client';
import { MyCommunitiesResponse } from '@/types/api';
import { useAuthStateStore } from '@/lib/stateStore';
import { useUIStore } from '@/lib/uiStore';
import { isActiveRoute, NavRoute, PRIMARY_NAV } from '@/data/ui/navigation';

const itemClasses = 'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors';

// onNavigate lets the mobile menu close itself when a link is followed
export default function SidebarList({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);
    const membershipVersion = useUIStore((state) => state.membershipVersion);
    const [communities, setCommunities] = useState<MyCommunitiesResponse['communities']>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Refetch on sign-in and whenever the viewer joins or leaves a community. Guests have none.
    useEffect(() => {
        if (!isAuthenticated) return;
        let isCurrent = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true);
        api<MyCommunitiesResponse>('/users/me/communities')
            .then((data) => isCurrent && setCommunities(data.communities))
            .catch(() => isCurrent && setCommunities([]))
            .finally(() => isCurrent && setIsLoading(false));
        return () => {
            isCurrent = false;
        };
    }, [isAuthenticated, membershipVersion]);

    return (
        <nav aria-label="Main" className="flex flex-col gap-4 p-3">
            <ul className="flex flex-col gap-0.5">
                {PRIMARY_NAV.map((route) => (
                    <SidebarItem
                        key={route.href}
                        route={route}
                        isActive={isActiveRoute(pathname, route.href)}
                        onNavigate={onNavigate}
                    />
                ))}
            </ul>

            {isAuthenticated && (isLoading || communities.length > 0) && (
                <>
                    <DividerLine />
                    <div className="flex flex-col gap-1">
                        <h2 className="px-3 text-xs font-bold uppercase tracking-wide text-muted">Your communities</h2>
                        {isLoading ? (
                            <div className="flex flex-col gap-2 px-3 py-1">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-6 w-1/2" />
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-0.5">
                                {communities.map((community) => {
                                    const href = `/c/${community.name}`;
                                    return (
                                        <li key={community.id}>
                                            <Link
                                                href={href}
                                                onClick={onNavigate}
                                                className={twMerge(
                                                    itemClasses,
                                                    'font-medium',
                                                    isActiveRoute(pathname, href)
                                                        ? 'bg-highlight text-highlight-fg'
                                                        : 'hover:bg-surface-muted'
                                                )}
                                            >
                                                <Avatar name={community.name} src={community.image_url} size="sm" />
                                                <span className="truncate">{community.name}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </>
            )}

            <DividerLine />
            <ul className="flex flex-wrap gap-x-3 gap-y-1 px-3 text-xs text-muted">
                {FOOTER_LINKS.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} onClick={onNavigate} className="hover:text-text hover:underline">
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

const FOOTER_LINKS = [
    { href: '/policies/content', label: 'Content policy' },
    { href: '/policies/community-guidelines', label: 'Guidelines' },
    { href: '/policies/moderators', label: 'For moderators' },
    { href: '/policies/legal', label: 'Legal and takedowns' },
];

function SidebarItem({
    route,
    isActive,
    onNavigate,
}: {
    route: NavRoute;
    isActive: boolean;
    onNavigate?: () => void;
}) {
    const Icon = route.icon;
    return (
        <li>
            <Link
                href={route.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={twMerge(
                    itemClasses,
                    isActive ? 'bg-highlight text-highlight-fg' : 'text-text hover:bg-surface-muted'
                )}
            >
                <Icon className="size-5" />
                <span>{route.label}</span>
            </Link>
        </li>
    );
}
