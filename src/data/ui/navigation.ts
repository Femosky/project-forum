import { Bell, Bookmark, Flame, Home, LucideIcon, Plus, User, Users } from 'lucide-react';

export interface NavRoute {
    href: string;
    icon: LucideIcon;
    label: string;
}

// Left sidebar (desktop) and the slide-out menu (mobile). Notifications shows the unread count.
export const PRIMARY_NAV: NavRoute[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/trending', icon: Flame, label: 'Trending' },
    { href: '/communities', icon: Users, label: 'Communities' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/saved', icon: Bookmark, label: 'Saved' },
];

// Bottom tab bar on mobile
export const TAB_BAR_NAV: NavRoute[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/communities', icon: Users, label: 'Communities' },
    { href: '/submit', icon: Plus, label: 'New post' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/profile', icon: User, label: 'Profile' },
];

export function isActiveRoute(pathname: string, href: string): boolean {
    return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
