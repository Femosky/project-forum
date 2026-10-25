'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, ChevronsUpDown, LogOut, Monitor, Moon, Settings, Sun, User } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import {
    Dropdown,
    DropdownContent,
    DropdownItem,
    DropdownLabel,
    DropdownRadioGroup,
    DropdownRadioItem,
    DropdownSeparator,
    DropdownTrigger,
} from '@/components/ui/Dropdown';
import { applyTheme, ThemeChoice } from '@/components/theme/ThemeMenu';
import { api } from '@/lib/api/client';
import { useAuthStateStore } from '@/lib/stateStore';
import { Theme, THEMES } from '@/lib/constants';
import { UserResponse } from '@/types/api';

// Bottom of the desktop sidebar: who you are, with your account, saved items, settings, theme and log out.
// Guests get Log in and Sign up instead.
export function SidebarAccount({ initialTheme }: { initialTheme: Theme | null }) {
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);
    const logout = useAuthStateStore((state) => state.logout);
    const [username, setUsername] = useState<string | null>(null);
    const [theme, setTheme] = useState<ThemeChoice>(initialTheme ?? 'system');
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;
        let isCurrent = true;
        api<UserResponse>('/auth/me')
            .then((data) => isCurrent && setUsername(data.user.username))
            .catch(() => null);
        return () => {
            isCurrent = false;
        };
    }, [isAuthenticated]);

    function changeTheme(value: string) {
        const next = (THEMES as readonly string[]).includes(value) ? (value as Theme) : 'system';
        setTheme(next);
        applyTheme(next);
    }

    async function handleLogout() {
        setIsLeaving(true);
        // Even if this fails the session is over on this device, so reset and reload
        await api('/auth/logout', { method: 'POST' }).catch(() => null);
        logout();
        window.location.reload();
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col gap-2">
                <Button asChild size="sm">
                    <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                    <Link href="/auth/signup">Sign up</Link>
                </Button>
            </div>
        );
    }

    return (
        <Dropdown>
            <DropdownTrigger asChild>
                <button
                    type="button"
                    className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm font-medium transition-colors hover:bg-hover"
                >
                    <Avatar name={username ?? '?'} size="sm" className="size-5" />
                    <span className="min-w-0 flex-1 truncate">{username ?? 'Account'}</span>
                    <ChevronsUpDown className="size-4 text-subtle" />
                </button>
            </DropdownTrigger>
            <DropdownContent side="top" align="start" className="w-56">
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
                <DropdownSeparator />
                <DropdownLabel>Theme</DropdownLabel>
                <DropdownRadioGroup value={theme} onValueChange={changeTheme}>
                    <DropdownRadioItem value="light">
                        <Sun /> Light
                    </DropdownRadioItem>
                    <DropdownRadioItem value="dark">
                        <Moon /> Dark
                    </DropdownRadioItem>
                    <DropdownRadioItem value="system">
                        <Monitor /> System
                    </DropdownRadioItem>
                </DropdownRadioGroup>
                <DropdownSeparator />
                <DropdownItem onSelect={handleLogout} disabled={isLeaving}>
                    <LogOut /> {isLeaving ? 'Logging out...' : 'Log out'}
                </DropdownItem>
            </DropdownContent>
        </Dropdown>
    );
}

export default SidebarAccount;
