import SidebarList from '@/components/common/SidebarList';
import { twMerge } from 'tailwind-merge';
import { ComponentProps } from 'react';

type LeftSidebarProps = ComponentProps<'aside'>;

// Desktop only; on small screens the same list lives in the header's slide-out menu
export default function LeftSidebar({ className, ...props }: LeftSidebarProps) {
    return (
        <aside
            className={twMerge(
                'hidden md:block w-sidebar shrink-0 sticky top-header h-[calc(100dvh-var(--spacing-header))] overflow-y-auto border-r border-border bg-pane',
                className
            )}
            {...props}
        >
            <SidebarList />
        </aside>
    );
}
