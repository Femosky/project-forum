'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { DividerLine } from '../ui/DividerLine';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { usePOST } from '@/hooks/usePOST';
import { APIUtility } from '@/lib/utils/APIUtility';
import { CommunitiesResponse } from '@/types/api';
import { useAuthStateStore } from '@/lib/stateStore';
import { isActiveRoute, NavRoute, PRIMARY_NAV } from '@/data/ui/navigation';

const itemClasses = 'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors';

// onNavigate lets the mobile menu close itself when a link is followed
export default function SidebarList({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { data, isLoading, sendData } = usePOST<CommunitiesResponse>();
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);

    useEffect(() => {
        // Guests have no communities; fetching would 401 and bounce them to the login page
        if (!isAuthenticated) return;

        async function fetchCommunities() {
            await sendData(`${APIUtility.getApiUrl()}/community/get/communities`);
        }

        fetchCommunities();
        // Fetch when the user logs in
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const communities = data?.communities ?? [];

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
                                    const href = `/community/${community.name}`;
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
        </nav>
    );
}

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
