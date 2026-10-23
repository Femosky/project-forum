'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import { useAuthStateStore } from '@/lib/stateStore';
import { UnreadBadge } from './NotificationBadge';

// Header bell on larger screens; on phones the bottom tab bar has Notifications instead
export function NotificationBell() {
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);
    if (!isAuthenticated) return null;

    return (
        <IconButton asChild aria-label="Notifications" className="relative hidden md:inline-flex">
            <Link href="/notifications">
                <Bell />
                <UnreadBadge />
            </Link>
        </IconButton>
    );
}

export default NotificationBell;
