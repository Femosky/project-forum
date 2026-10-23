'use client';

import { Bookmark, Ellipsis, Flag } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';

// "..." menu on posts and comments. Actions aren't wired to the API yet.
export function ContentOptionsMenu({ label = 'More options' }: { label?: string }) {
    return (
        <Dropdown>
            <DropdownTrigger asChild>
                <IconButton aria-label={label} size="sm" className="relative z-10">
                    <Ellipsis />
                </IconButton>
            </DropdownTrigger>
            <DropdownContent>
                <DropdownItem>
                    <Bookmark /> Save
                </DropdownItem>
                <DropdownItem destructive>
                    <Flag /> Report
                </DropdownItem>
            </DropdownContent>
        </Dropdown>
    );
}

export default ContentOptionsMenu;
