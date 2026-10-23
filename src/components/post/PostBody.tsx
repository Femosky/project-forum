'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Markdown from '@/components/common/Markdown';
import MarkdownEditor from '@/components/common/MarkdownEditor';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { POST_BODY_MAX } from '@/lib/constants';
import { useUIStore } from '@/lib/uiStore';
import TimeUtility from '@/lib/utils/TimeUtility';
import { Post, PostResponse } from '@/types/api';

// The body of a post on its own page. The author can edit it in place from the post's "..." menu.
export function PostBody({ post }: { post: Post }) {
    const [body, setBody] = useState(post.body);
    const [editedAt, setEditedAt] = useState(post.edited_at);
    const [draft, setDraft] = useState(post.body);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isEditing = useUIStore((state) => state.editingPostId === post.id);
    const setEditingPost = useUIStore((state) => state.setEditingPost);

    function cancel() {
        setDraft(body);
        setError(null);
        setEditingPost(null);
    }

    async function save() {
        setIsSaving(true);
        setError(null);
        try {
            const { post: updated } = await api<PostResponse>(`/posts/${post.id}`, { method: 'PATCH', body: { body: draft.trim() } });
            setBody(updated.body);
            setEditedAt(updated.edited_at);
            setEditingPost(null);
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    if (isEditing) {
        return (
            <div className="flex flex-col gap-2">
                <MarkdownEditor
                    name="body"
                    placeholder="Add details, background or what you've already tried"
                    maxLength={POST_BODY_MAX}
                    value={draft}
                    onChange={setDraft}
                    autoFocus
                />
                <p className="text-xs text-muted">Titles can&apos;t be changed, so replies still match the question.</p>
                {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={cancel} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={save} disabled={isSaving || draft.trim() === body}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            {body && <Markdown text={body} />}
            {editedAt && (
                <p className="text-xs text-muted" suppressHydrationWarning>
                    Edited {TimeUtility.formatTimeAgo(editedAt)}
                </p>
            )}
        </>
    );
}

export default PostBody;
