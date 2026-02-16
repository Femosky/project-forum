import SidebarList from '@/components/common/SidebarList';
import { LEFT_SIDEBAR_LIST } from '@/data/ui/leftSidebarList';

export default function LeftSidebar() {
    return (
        <aside className="w-64 shrink-0 px-2 border-r border-gray-200">
            {/* Routes */}
            <SidebarList list={LEFT_SIDEBAR_LIST} />
        </aside>
    );
}
