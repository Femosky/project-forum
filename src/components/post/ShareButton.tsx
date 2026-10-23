'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import Button from '@/components/ui/Button';

// Native share sheet where the browser has one (most phones), otherwise copy the link
export function ShareButton({ path, title }: { path: string; title: string }) {
    const [copied, setCopied] = useState(false);

    async function handleShare() {
        const url = new URL(path, window.location.origin).toString();

        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch {
                // The user closed the share sheet
            }
            return;
        }

        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleShare} className="relative z-10 text-muted hover:text-text">
            {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
            {copied ? 'Copied' : 'Share'}
        </Button>
    );
}

export default ShareButton;
