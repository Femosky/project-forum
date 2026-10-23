'use client';

import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import { useEffect, useState } from 'react';

export default function ContentReplySection({
    fromReply,
    toggleReplyMode,
    handleReply,
    resetReplyContent = false,
}: {
    fromReply?: boolean;
    toggleReplyMode?: () => void;
    handleReply?: (replyContent: string) => void;
    resetReplyContent: boolean;
}) {
    const [isOpen, setIsOpen] = useState(fromReply ?? false);
    const [replyContent, setReplyContent] = useState('');

    function toggleOpen() {
        setIsOpen(true);
    }

    function toggleCancel() {
        if (fromReply && fromReply === true) {
            toggleReplyMode?.();
        } else {
            setIsOpen(false);
        }
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (replyContent.trim() === '') {
            return;
        }

        handleReply?.(replyContent);
    }

    useEffect(() => {
        function reset() {
            setReplyContent('');
        }

        if (resetReplyContent) {
            reset();
        }
    }, [resetReplyContent]);

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
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
            />

            <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={toggleCancel}>
                    Cancel
                </Button>
                <Button type="submit" size="sm" disabled={replyContent.trim() === ''}>
                    Reply
                </Button>
            </div>
        </form>
    );
}
