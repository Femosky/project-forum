'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/Dialog';
import SidebarList from '@/components/common/SidebarList';
import { LogoMark } from '@/app/_components/LogoSection';
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

            <SheetContent
                side="left"
                title={APP_NAME}
                hideTitle
                className="rounded-r-3xl border-r-0 bg-bar pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl backdrop-saturate-150"
            >
                <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5 px-6 pb-6 pt-6 text-[22px] font-semibold tracking-tight">
                    <LogoMark className="h-8 w-auto" />
                    {APP_NAME}
                </Link>
                <SidebarList large onNavigate={() => setIsOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

export default MobileNav;
