'use client';

import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { COMMENT_BODY_MAX } from '@/lib/constants';
import { errorMessage } from '@/lib/api/errors';
import { useState } from 'react';

// Reply composer. handleReply resolves when the comment is saved; the text is kept if it fails.
export default function ContentReplySection({
    fromReply,
    toggleReplyMode,
    handleReply,
}: {
    fromReply?: boolean;
    toggleReplyMode?: () => void;
    handleReply: (replyContent: string) => Promise<void>;
}) {
    const [isOpen, setIsOpen] = useState(fromReply ?? false);
    const [replyContent, setReplyContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requireAuth = useRequireAuth();

    function toggleOpen() {
        if (!requireAuth('reply')) return;
        setIsOpen(true);
    }

    function toggleCancel() {
        setError(null);
        if (fromReply) {
            toggleReplyMode?.();
        } else {
            setIsOpen(false);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (replyContent.trim() === '' || isSending) return;

        setIsSending(true);
        setError(null);
        try {
            await handleReply(replyContent.trim());
            setReplyContent('');
            if (!fromReply) setIsOpen(false);
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setIsSending(false);
        }
    }

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={toggleOpen}
                className="flex h-11 w-full cursor-text items-center rounded-full border border-border-strong bg-surface px-4 text-left text-muted transition-colors hover:border-text"
            >
                Add a reply
            </button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 rounded-2xl border border-border-strong bg-surface px-3 py-2 focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/40"
        >
            <TextArea
                variant="bare"
                name="comment"
                aria-label="Your reply"
                placeholder="Add a reply"
                autoFocus
                maxLength={COMMENT_BODY_MAX}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
            />

            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}

            <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={toggleCancel} disabled={isSending}>
                    Cancel
                </Button>
                <Button type="submit" size="sm" disabled={replyContent.trim() === '' || isSending}>
                    {isSending ? 'Replying...' : 'Reply'}
                </Button>
            </div>
        </form>
    );
}
