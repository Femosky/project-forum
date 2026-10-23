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

    return (
        <div>
            {!isOpen ? (
                <Button variant="add-reply" size="add-reply-1" className="w-full text-start" onClick={toggleOpen}>
                    Add a reply
                </Button>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col border border-gray-200 rounded-3xl px-3 py-2 gap-2"
                >
                    <TextArea
                        variant="add-reply"
                        name="comment"
                        placeholder="Add a reply"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                    />

                    <div className="place-self-end flex gap-2">
                        <Button size="add-reply-2" variant="neutral" className="text-start" onClick={toggleCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" size="add-reply-2" className="text-start">
                            Reply
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
