'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { api } from '@/lib/api/client';
import { useAuthStateStore } from '@/lib/stateStore';
import { Bookmark, LogOut, Plus, Settings, User } from 'lucide-react';
import { useState } from 'react';

export function UserSection() {
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);
    const logout = useAuthStateStore((state) => state.logout);

    const [isLoading, setIsLoading] = useState(false);

    async function handleLogout() {
        setIsLoading(true);
        // Even if this fails the session is over on this device, so reset and reload
        await api('/auth/logout', { method: 'POST' }).catch(() => null);
        logout();
        window.location.reload();
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center gap-2">
                <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
                    <Link href="/auth/signup">Sign up</Link>
                </Button>
                <Button asChild size="sm">
                    <Link href="/auth/login">Log in</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {/* On mobile, Create lives in the bottom tab bar */}
            <Button asChild variant="secondary" size="sm" className="hidden md:inline-flex">
                <Link href="/submit">
                    <Plus className="size-4" /> Create
                </Link>
            </Button>

            <Dropdown>
                <DropdownTrigger asChild>
                    <button
                        type="button"
                        aria-label="Account menu"
                        className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-highlight text-highlight-fg"
                    >
                        <User className="size-5" />
                    </button>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownItem asChild>
                        <Link href="/profile">
                            <User /> Profile
                        </Link>
                    </DropdownItem>
                    <DropdownItem asChild>
                        <Link href="/saved">
                            <Bookmark /> Saved
                        </Link>
                    </DropdownItem>
                    <DropdownItem asChild>
                        <Link href="/settings">
                            <Settings /> Settings
                        </Link>
                    </DropdownItem>
                    <DropdownItem onSelect={handleLogout} disabled={isLoading}>
                        <LogOut /> {isLoading ? 'Logging out...' : 'Log out'}
                    </DropdownItem>
                </DropdownContent>
            </Dropdown>
        </div>
    );
}
