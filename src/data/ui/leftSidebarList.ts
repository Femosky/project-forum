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
    {
        type: 'static',
        title: 'routes1',
        titleVisible: false,
        routes: [
            { href: '/', icon: '🏠', label: 'Home' },
            { href: '/trending', icon: '🔥', label: 'Trending' },
            { href: '/saved', icon: '🔖', label: 'Saved' },
        ],
    },
    {
        type: 'static',
        title: 'routes2',
        titleVisible: false,
        routes: [
            { href: '/', icon: '🏠', label: 'Home' },
            { href: '/trending', icon: '🔥', label: 'Trending' },
            { href: '/saved', icon: '🔖', label: 'Saved' },
        ],
    },
    {
        type: 'static',
        title: 'routes3',
        titleVisible: false,
        routes: [
            { href: '/', icon: '🏠', label: 'Home' },
            { href: '/trending', icon: '🔥', label: 'Trending' },
            { href: '/saved', icon: '🔖', label: 'Saved' },
        ],
    },
    {
        type: 'static',
        title: 'routes4',
        titleVisible: false,
        routes: [
            { href: '/', icon: '🏠', label: 'Home' },
            { href: '/trending', icon: '🔥', label: 'Trending' },
            { href: '/saved', icon: '🔖', label: 'Saved' },
        ],
    },
    {
        type: 'static',
        title: 'routes5',
        titleVisible: false,
        routes: [
            { href: '/', icon: '🏠', label: 'Home' },
            { href: '/trending', icon: '🔥', label: 'Trending' },
            { href: '/saved', icon: '🔖', label: 'Saved' },
        ],
    },
    {
        type: 'static',
        title: 'routes6',
        titleVisible: false,
        routes: [
            { href: '/', icon: '🏠', label: 'Home' },
            { href: '/trending', icon: '🔥', label: 'Trending' },
            { href: '/saved', icon: '🔖', label: 'Saved' },
        ],
    },
    {
        type: 'static',
        title: 'routes7',
        titleVisible: false,
        routes: [
            { href: '/', icon: '🏠', label: 'Home' },
            { href: '/trending', icon: '🔥', label: 'Trending' },
            { href: '/saved', icon: '🔖', label: 'Saved' },
        ],
    },
];
