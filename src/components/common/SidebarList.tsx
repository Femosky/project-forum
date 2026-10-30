'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Avatar from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { api } from '@/lib/api/client';
import { ModerationOverview, MyCommunitiesResponse } from '@/types/api';
import { useAuthStateStore } from '@/lib/stateStore';
import { useUIStore } from '@/lib/uiStore';
import { isActiveRoute, NavRoute, PRIMARY_NAV } from '@/data/ui/navigation';
import { communityLabel } from '@/lib/communityName';
import CookieSettingsButton from '@/components/consent/CookieSettingsButton';

// Flat rows: no pill behind the current page, just full-strength text and a thin red marker at the edge
const itemClasses =
    'relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium text-muted transition-colors hover:text-text';
const activeClasses =
    "text-text font-semibold before:absolute before:-left-2 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-brand before:content-['']";

// onNavigate lets the mobile menu close itself when a link is followed
export default function SidebarList({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);
    const membershipVersion = useUIStore((state) => state.membershipVersion);
    const [communities, setCommunities] = useState<MyCommunitiesResponse['communities']>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modCount, setModCount] = useState<number | null>(null);

    // Refetch on sign-in and whenever the viewer joins or leaves a community. Guests have none.
    useEffect(() => {
        if (!isAuthenticated) return;
        let isCurrent = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true);
        api<MyCommunitiesResponse>('/users/me/communities')
            .then((data) => {
                if (!isCurrent) return;
                setCommunities(data.communities);
                if (data.communities.some(({ role }) => role !== 'member')) {
                    api<ModerationOverview>('/moderation/overview')
                        .then((overview) => isCurrent && setModCount(overview.total))
                        .catch(() => isCurrent && setModCount(0));
                } else setModCount(null);
            })
            .catch(() => isCurrent && setCommunities([]))
            .finally(() => isCurrent && setIsLoading(false));
        return () => {
            isCurrent = false;
        };
    }, [isAuthenticated, membershipVersion]);

    return (
        <nav aria-label="Main" className="flex flex-col gap-4">
            <ul className="flex flex-col gap-px">
                {PRIMARY_NAV.filter((route) => isAuthenticated || route.href !== '/notifications').map((route) => (
                    <SidebarItem
                        key={route.href}
                        route={route}
                        isActive={isActiveRoute(pathname, route.href)}
                        onNavigate={onNavigate}
                    />
                ))}
                {isAuthenticated && modCount !== null && (
                    <SidebarItem
                        route={MODERATION_ROUTE}
                        count={modCount}
                        isActive={isActiveRoute(pathname, MODERATION_ROUTE.href)}
                        onNavigate={onNavigate}
                    />
                )}
            </ul>

            {isAuthenticated && (isLoading || communities.length > 0) && (
                <div className="flex flex-col gap-px">
                    <h2 className="px-2 pb-1 text-xs font-semibold text-subtle">Your communities</h2>
                    {isLoading ? (
                        <div className="flex flex-col gap-2 px-2 py-1">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-5 w-1/2" />
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-px">
                            {communities.map((community) => {
                                const href = `/c/${community.name}`;
                                return (
                                    <li key={community.id}>
                                        <Link
                                            href={href}
                                            onClick={onNavigate}
                                            aria-current={isActiveRoute(pathname, href) ? 'page' : undefined}
                                            className={twMerge(itemClasses, isActiveRoute(pathname, href) && activeClasses)}
                                        >
                                            <Avatar name={community.name} src={community.image_url} shape="square" className="size-[18px] text-[10px]" />
                                            <span className="truncate">{communityLabel(community)}</span>
                                            {community.role !== 'member' && (
                                                <span className="ml-auto text-[11px] font-semibold text-subtle">{community.role === 'owner' ? 'Owner' : 'Mod'}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <Link href="/communities" onClick={onNavigate} className={twMerge(itemClasses, 'text-subtle')}>
                        <Plus className="size-4" /> Browse more
                    </Link>
                </div>
            )}

            <ul className="flex flex-wrap gap-x-3 gap-y-1 px-2 text-xs text-subtle">
                {FOOTER_LINKS.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} onClick={onNavigate} className="hover:text-text hover:underline">
                            {link.label}
                        </Link>
                    </li>
                ))}
                <li>
                    <CookieSettingsButton className="cursor-pointer hover:text-text hover:underline" />
                </li>
            </ul>
        </nav>
    );
}

const FOOTER_LINKS = [
    { href: '/policies/content', label: 'Content policy' },
    { href: '/policies/community-guidelines', label: 'Guidelines' },
    { href: '/policies/moderators', label: 'For moderators' },
    { href: '/policies/legal', label: 'Legal and takedowns' },
    { href: '/policies/terms', label: 'Terms' },
    { href: '/policies/privacy', label: 'Privacy' },
    { href: '/policies/cookies', label: 'Cookies' },
];

const MODERATION_ROUTE = { href: '/moderation', label: 'Moderation', icon: ShieldCheck } as NavRoute;

function SidebarItem({ route, isActive, onNavigate, count }: { route: NavRoute; isActive: boolean; onNavigate?: () => void; count?: number }) {
    const Icon = route.icon;
    const unreadCount = useUIStore((state) => state.unreadCount);
    const unread = count ?? unreadCount;
    const showCount = (count !== undefined || route.href === '/notifications') && Boolean(unread);
    return (
        <li>
            <Link
                href={route.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={twMerge(itemClasses, isActive && activeClasses)}
            >
                <Icon className="size-4" />
                <span>{route.label}</span>
                {showCount && (
                    <span className="ml-auto rounded-full bg-brand px-1.5 text-[11px] font-semibold leading-[18px] text-white tabular-nums">
                        {unread! > 99 ? '99+' : unread}
                        <span className="sr-only"> waiting</span>
                    </span>
                )}
            </Link>
        </li>
    );
}
