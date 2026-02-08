export interface SidebarListProps {
    type: 'static' | 'dynamic';
    title: string;
    titleVisible: boolean;
    routes: SidebarRouteProps[];
}

export interface SidebarRouteProps {
    href: string;
    icon: string;
    label: string;
}

export const LEFT_SIDEBAR_LIST: SidebarListProps[] = [
    {
        type: 'static',
        title: 'routes',
        titleVisible: false,
        routes: [
            { href: '/', icon: '🏠', label: 'Home' },
            { href: '/trending', icon: '🔥', label: 'Trending' },
            { href: '/saved', icon: '🔖', label: 'Saved' },
        ],
    },
    {
        type: 'dynamic',
        title: 'Your communities',
        titleVisible: true,
        routes: [
            { href: '/community-1', icon: '🏠', label: 'Community 1' },
            { href: '/community-2', icon: '🔥', label: 'Community 2' },
            { href: '/community-3', icon: '🔖', label: 'Community 3' },
            { href: '/community-4', icon: '🌍', label: 'Community 4' },
        ],
    },
];
