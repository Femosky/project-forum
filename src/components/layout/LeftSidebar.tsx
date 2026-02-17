import SidebarList from '@/components/common/SidebarList';
import { LEFT_SIDEBAR_LIST } from '@/data/ui/leftSidebarList';
import { twMerge } from 'tailwind-merge';
import { ComponentProps } from 'react';

type LeftSidebarProps = ComponentProps<'aside'>;

export default function LeftSidebar({ className, ...props }: LeftSidebarProps) {
    return (
        <aside className={twMerge('0w-64 shrink-0 h-full px-2 border-r border-gray-200', className)} {...props}>
            {/* Routes */}
            <SidebarList list={LEFT_SIDEBAR_LIST} />
        </aside>
    );
}
