'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api/client';

// Counts this visit once per browser session: one view for the post and one for each comment on screen at load.
// The API ignores bots and the author's own visits; only authors ever see the numbers.
export function PostViewBeacon({ postId, commentIds }: { postId: string; commentIds: string[] }) {
    useEffect(() => {
        const key = `viewed:${postId}`;
        try {
            if (sessionStorage.getItem(key)) return;
            sessionStorage.setItem(key, '1');
        } catch {
            // Storage blocked: count anyway
        }
        api(`/posts/${postId}/view`, { method: 'POST', body: { comment_ids: commentIds.slice(0, 100) } }).catch(() => null);
        // Once per post: the comment list it was sent with is what was on screen at load
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId]);
    return null;
}

export default PostViewBeacon;
