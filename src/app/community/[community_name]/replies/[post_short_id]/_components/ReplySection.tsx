'use client';

import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import { useState } from 'react';

export default function ReplySection() {
    const [isOpen, setIsOpen] = useState(false);
    function handleClick() {
        setIsOpen(!isOpen);
    }
    return (
        <div>
            {!isOpen ? (
                <Button variant="add-reply" size="add-reply-1" className="w-full text-start" onClick={handleClick}>
                    Add a reply
                </Button>
            ) : (
                <form className="flex flex-col border border-gray-200 rounded-3xl px-3 py-2 gap-2">
                    <TextArea variant="add-reply" name="comment" placeholder="Add a reply" />

                    <div className="place-self-end flex gap-2">
                        <Button size="add-reply-2" variant="neutral" className="text-start" onClick={handleClick}>
                            Cancel
                        </Button>
                        <Button size="add-reply-2" className="text-start">
                            Reply
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
