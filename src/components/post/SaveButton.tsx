'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUIStore } from '@/lib/uiStore';

// Saved state for a post or comment ("/posts/<id>"), shared by every control on the page that saves it
export function useSaved(path: string, initiallySaved = false) {
    const requireAuth = useRequireAuth();
    const isSaved = useUIStore((state) => state.savedChanges[path]) ?? initiallySaved;
    const setSaved = useUIStore((state) => state.setSaved);

    async function toggleSave() {
        if (!requireAuth('save')) return;
        const next = !isSaved;
        setSaved(path, next);
        try {
            await api(`${path}/save`, { method: next ? 'PUT' : 'DELETE' });
        } catch {
            setSaved(path, !next);
        }
    }

    return { isSaved, toggleSave };
}

// Save in the post page's top bar. The label hides on phones, where the bar is narrow.
export function SaveButton({ postId, saved }: { postId: string; saved?: boolean }) {
    const { isSaved, toggleSave } = useSaved(`/posts/${postId}`, saved);

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleSave}
            aria-pressed={isSaved}
            aria-label={isSaved ? 'Saved' : 'Save'}
            className="h-8 gap-1.5 px-2 font-semibold text-muted hover:text-text sm:px-2.5"
        >
            {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
        </Button>
    );
}

export default SaveButton;
