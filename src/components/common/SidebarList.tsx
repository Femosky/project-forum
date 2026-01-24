import Link from 'next/link';
import TextUtility from '@/lib/utils/TextUtility';
import { SidebarListProps, SidebarRouteProps } from '@/data/ui/leftSidebarList';
import { DividerLine } from '../ui/DividerLine';

export default function SidebarList({ list }: { list: SidebarListProps[] }) {
    return (
        <>
            {list.map((group: SidebarListProps, index: number) => {
                return (
                    <div key={group.title} className="flex flex-col gap-4">
                        <div className="rounded-lg flex flex-col mt-4 gap-2">
                            {group.titleVisible && (
                                <h2 className="text-lg font-medium">{TextUtility.capitalize(group.title)}</h2>
                            )}
                            <ul className="flex flex-col">
                                {group.routes?.map((route: SidebarRouteProps) => {
                                    return <SidebarItem key={route.href} route={route as SidebarRouteProps} />;
                                })}
                            </ul>
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
