'use client';

import Link from 'next/link';
import TextUtility from '@/lib/utils/TextUtility';
import { SidebarListProps, SidebarRouteProps } from '@/data/ui/leftSidebarList';
import { DividerLine } from '../ui/DividerLine';
import { usePOST } from '@/hooks/usePOST';
import { useEffect } from 'react';
import { APIUtility } from '@/lib/utils/APIUtility';
import { CommunitiesResponse } from '@/types/api';
import { useAuthStateStore } from '@/lib/stateStore';

export default function SidebarList({ list }: { list: SidebarListProps[] }) {
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

    return (
        <>
            {list.map((group: SidebarListProps, index: number) => {
                return (
                    <div key={group.title} className="flex flex-col gap-4">
                        <div className="rounded-lg flex flex-col mt-4 gap-2">
                            {group.titleVisible && group.type === 'static' && (
                                <h2 className="text-lg font-medium">{TextUtility.capitalize(group.title)}</h2>
                            )}

                            {group.titleVisible && group.type === 'api' && data !== null && (
                                <h2 className="text-lg font-medium">{TextUtility.capitalize(group.title)}</h2>
                            )}

                            {group.type === 'static' ? (
                                <ul className="flex flex-col">
                                    {group.routes?.map((route: SidebarRouteProps) => {
                                        return <SidebarItem key={route.href} route={route as SidebarRouteProps} />;
                                    })}
                                </ul>
                            ) : isLoading ? (
                                <div>Loading...</div>
                            ) : (
                                data?.communities?.map((community) => {
                                    return (
                                        <SidebarItem
                                            key={community.id}
                                            route={{
                                                href: `/community/${community.name}`,
                                                icon: '🏠',
                                                label: community.name,
                                            }}
                                        />
                                    );
                                })
                            )}
                        </div>

                        {index < list.length - 1 && group.type === 'static' && <DividerLine />}
                        {index < list.length - 1 && group.type === 'api' && data !== null && <DividerLine />}
                    </div>
                );
            })}
        </>
    );
}

function SidebarItem({ route }: { route: SidebarRouteProps }) {
    return (
        <li className="flex">
            <Link href={route.href} className="hover:bg-gray-100 rounded-lg p-2 w-full">
                <div className="flex gap-4">
                    <span>{route.icon}</span>
                    <span>{route.label}</span>
                </div>
            </Link>
        </li>
    );
}
