'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/Dialog';
import SidebarList from '@/components/common/SidebarList';
import { APP_NAME } from '@/lib/constants';

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <IconButton aria-label="Open menu" className="md:hidden -ml-2">
                    <Menu />
                </IconButton>
            </SheetTrigger>

            <SheetContent side="left" title={APP_NAME}>
                <SidebarList onNavigate={() => setIsOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

export default MobileNav;
