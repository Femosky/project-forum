'use client';

import Button from '@/components/ui/Button';
import MarkdownEditor from '@/components/common/LazyMarkdownEditor';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { COMMENT_BODY_MAX } from '@/lib/constants';
import { errorMessage } from '@/lib/api/errors';
import { useRef, useState } from 'react';

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
    const formRef = useRef<HTMLFormElement>(null);

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
                className="flex w-full cursor-text items-center gap-3 border-y border-border py-3 text-left text-[15px] text-subtle transition-colors hover:text-muted"
            >
                <span className="flex-1">Add a reply…</span>
                <span className="flex h-8 items-center rounded-[7px] bg-accent px-3 text-[13.5px] font-semibold text-accent-fg">Reply</span>
            </button>
        );
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
            <MarkdownEditor
                name="comment"
                variant="compact"
                placeholder="Add a reply"
                autoFocus
                maxLength={COMMENT_BODY_MAX}
                value={replyContent}
                onChange={setReplyContent}
                onSubmitShortcut={() => formRef.current?.requestSubmit()}
                footer={
                    <>
                        <Button size="sm" variant="ghost" onClick={toggleCancel} disabled={isSending}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={replyContent.trim() === '' || isSending}>
                            {isSending ? 'Replying...' : 'Reply'}
                        </Button>
                    </>
                }
            />
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
        </form>
    );
}
