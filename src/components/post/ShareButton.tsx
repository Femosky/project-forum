'use client';

import { useState } from 'react';
import { Check, Link2, Send, Share2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { APP_URL } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';

// Places people share to, most-used first. Each opens the service's own share page in a new tab.
const TARGETS: { label: string; href: (url: string, title: string) => string }[] = [
    { label: 'WhatsApp', href: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: 'X', href: (url, title) => `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: 'Facebook', href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: 'Telegram', href: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
];

// The phone's own share sheet where there is one; otherwise a menu of common apps and "Copy link"
export function ShareButton({ path, title }: { path: string; title: string }) {
    const [copied, setCopied] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // The menu's links are built during render, which also happens on the server (where there's no window)
    const url = () => new URL(path, typeof window === 'undefined' ? APP_URL : window.location.origin).toString();

    async function handleClick() {
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title, url: url() });
                trackEvent('share', { channel: 'native' });
            } catch {
                // The user closed the share sheet
            }
            return;
        }
        setIsMenuOpen(true);
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(url());
            trackEvent('share', { channel: 'copy_link' });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copy this link', url());
        }
    }

    return (
        <Dropdown open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    // Radix opens the menu on pointer down; let handleClick decide between the share sheet and the menu
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={handleClick}
                    className="relative z-10 text-muted hover:text-text"
                >
                    {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
                    {copied ? 'Copied' : 'Share'}
                </Button>
            </DropdownTrigger>
            <DropdownContent align="start">
                {TARGETS.map((target) => (
                    <DropdownItem key={target.label} asChild>
                        <a
                            href={target.href(url(), title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('share', { channel: target.label.toLowerCase() })}
                        >
                            <Send /> {target.label}
                        </a>
                    </DropdownItem>
                ))}
                <DropdownItem onSelect={copyLink}>
                    <Link2 /> Copy link
                </DropdownItem>
            </DropdownContent>
        </Dropdown>
    );
}

export default ShareButton;
