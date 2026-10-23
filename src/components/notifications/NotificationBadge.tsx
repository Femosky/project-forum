'use client';

import { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { api } from '@/lib/api/client';
import { useAuthStateStore } from '@/lib/stateStore';
import { useUIStore } from '@/lib/uiStore';
import { UnreadCountResponse } from '@/types/api';

const POLL_MS = 60_000;

// Keeps the unread count fresh while signed in: on load, every minute while the tab is visible, and on focus.
// Mounted once in the layout; the bell and the tab bar read the count from the store.
export function NotificationPoller() {
    const isAuthenticated = useAuthStateStore((state) => state.isAuthenticated);
    const setUnreadCount = useUIStore((state) => state.setUnreadCount);

    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(null);
            return;
        }

        let isCurrent = true;
        async function refresh() {
            if (document.visibilityState !== 'visible') return;
            try {
                const { count } = await api<UnreadCountResponse>('/notifications/unread-count');
                if (isCurrent) setUnreadCount(count);
            } catch {
                // Keep the last known count
            }
        }

        refresh();
        const timer = setInterval(refresh, POLL_MS);
        window.addEventListener('focus', refresh);
        return () => {
            isCurrent = false;
            clearInterval(timer);
            window.removeEventListener('focus', refresh);
        };
    }, [isAuthenticated, setUnreadCount]);

    return null;
}

// Small count bubble for the bell and the tab bar icon
export function UnreadBadge({ className }: { className?: string }) {
    const count = useUIStore((state) => state.unreadCount);
    if (!count) return null;

    return (
        <span
            className={twMerge(
                'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-surface tabular-nums',
                className
            )}
        >
            {count > 99 ? '99+' : count}
            <span className="sr-only"> unread notifications</span>
        </span>
    );
}
