'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { useFetch } from '@/hooks/useFetch';
import { useAuthStateStore } from '@/lib/stateStore';
import { APIUtility } from '@/lib/utils/APIUtility';
import ErrorUtility from '@/lib/utils/ErrorUtility';
import { LogOut, Plus, User } from 'lucide-react';
import { useEffect } from 'react';

export function UserSection() {
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);
    const logout = useAuthStateStore((state) => state.logout);

    const { data, error, isLoading, fetchData } = useFetch();

    async function handleLogout() {
        await fetchData(`${APIUtility.getApiUrl()}/auth/logout`);
    }

    // Either way the session is over on this device, so reset and reload
    useEffect(() => {
        if (!ErrorUtility.isNullOrUndefined(data) || !ErrorUtility.isNullOrUndefined(error)) {
            logout();
            window.location.reload();
        }
    }, [data, error, logout]);

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
                    <DropdownItem onSelect={handleLogout} disabled={isLoading}>
                        <LogOut /> {isLoading ? 'Logging out...' : 'Log out'}
                    </DropdownItem>
                </DropdownContent>
            </Dropdown>
        </div>
    );
}
