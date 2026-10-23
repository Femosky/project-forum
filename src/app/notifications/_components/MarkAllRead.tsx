'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api/client';
import { useUIStore } from '@/lib/uiStore';
import { UnreadCountResponse } from '@/types/api';

// Marks everything read once the list has been shown, and clears the bell's badge
export function MarkAllRead() {
    const setUnreadCount = useUIStore((state) => state.setUnreadCount);

    useEffect(() => {
        api<UnreadCountResponse>('/notifications/read', { method: 'POST', body: {} })
            .then(({ count }) => setUnreadCount(count))
            .catch(() => null);
    }, [setUnreadCount]);

    return null;
}

export default MarkAllRead;
