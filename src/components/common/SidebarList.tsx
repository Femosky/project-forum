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
// The phone menu: tall rows for thumbs, larger text and icons, and a soft fill on the current page, like a native list
const largeItemClasses = 'relative flex h-12 items-center gap-3.5 rounded-2xl px-3 text-[17px] font-medium text-text transition-colors active:bg-hover';
const largeActiveClasses = 'bg-active font-semibold';

// onNavigate lets the mobile menu close itself when a link is followed; large is the phone menu's styling
export default function SidebarList({ onNavigate, large }: { onNavigate?: () => void; large?: boolean }) {
    const pathname = usePathname();
    const item = large ? largeItemClasses : itemClasses;
    const active = large ? largeActiveClasses : activeClasses;
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
        <nav aria-label="Main" className={twMerge('flex flex-col gap-4', large && 'flex-1 gap-6 px-3 pb-5')}>
            <ul className="flex flex-col gap-px">
                {PRIMARY_NAV.filter((route) => isAuthenticated || route.href !== '/notifications').map((route) => (
                    <SidebarItem
                        key={route.href}
                        route={route}
                        isActive={isActiveRoute(pathname, route.href)}
                        onNavigate={onNavigate}
                        item={item}
                        active={active}
                        large={large}
                    />
                ))}
                {isAuthenticated && modCount !== null && (
                    <SidebarItem
                        route={MODERATION_ROUTE}
                        count={modCount}
                        isActive={isActiveRoute(pathname, MODERATION_ROUTE.href)}
                        onNavigate={onNavigate}
                        item={item}
                        active={active}
                        large={large}
                    />
                )}
            </ul>

            {isAuthenticated && (isLoading || communities.length > 0) && (
                <div className="flex flex-col gap-px">
                    <h2 className={twMerge('px-2 pb-1 text-xs font-semibold text-subtle', large && 'px-3 pb-2 text-[13px]')}>Your communities</h2>
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
                                            className={twMerge(item, isActiveRoute(pathname, href) && active)}
                                        >
                                            <Avatar name={community.name} src={community.image_url} shape="square" className={large ? 'size-7 text-xs' : 'size-[18px] text-[10px]'} />
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
                    <Link href="/communities" onClick={onNavigate} className={twMerge(item, 'text-subtle')}>
                        <Plus className={large ? 'size-[22px]' : 'size-4'} /> Browse more
                    </Link>
                </div>
            )}

            <ul className={twMerge('flex flex-wrap gap-x-3 gap-y-1 px-2 text-xs text-subtle', large && 'mt-auto gap-x-4 gap-y-2 px-3 pt-4 text-[13px]')}>
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

function SidebarItem({
    route,
    isActive,
    onNavigate,
    count,
    item,
    active,
    large,
}: {
    route: NavRoute;
    isActive: boolean;
    onNavigate?: () => void;
    count?: number;
    item: string;
    active: string;
    large?: boolean;
}) {
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
                className={twMerge(item, isActive && active)}
            >
                <Icon className={large ? 'size-[22px]' : 'size-4'} strokeWidth={large ? 1.75 : undefined} />
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
