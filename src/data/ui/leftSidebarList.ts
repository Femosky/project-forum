export interface SidebarListProps {
    type: 'static' | 'api';
    title: string;
    titleVisible: boolean;
    routes?: SidebarRouteProps[];
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
        type: 'api',
        title: 'Your communities',
        titleVisible: true,
    },
];
