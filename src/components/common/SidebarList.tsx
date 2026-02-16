'use client';

import Link from 'next/link';
import TextUtility from '@/lib/utils/TextUtility';
import { SidebarListProps, SidebarRouteProps } from '@/data/ui/leftSidebarList';
import { DividerLine } from '../ui/DividerLine';
import { usePOST } from '@/hooks/usePOST';
import { useEffect } from 'react';
import { APIUtility } from '@/lib/utils/APIUtility';

export default function SidebarList({ list }: { list: SidebarListProps[] }) {
    const { data, isLoading, sendData } = usePOST();

    useEffect(() => {
        async function fetchCommunities() {
            await sendData(`${APIUtility.getApiUrl()}/community/get/communities`);
        }

        console.log('data: ', data);

        fetchCommunities();
    }, []);

    return (
        <>
            {list.map((group: SidebarListProps, index: number) => {
                return (
                    <div key={group.title} className="flex flex-col gap-4">
                        <div className="rounded-lg flex flex-col mt-4 gap-2">
                            {group.titleVisible && (
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
                                data &&
                                'communities' in data &&
                                data.communities?.map((community) => {
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

                        {index < list.length - 1 && <DividerLine />}
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
