'use client';

import { useState } from 'react';
import { Check, ChevronDown, Ellipsis, Link2, Mail, Send, Share, Share2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from '@/components/ui/Dropdown';
import { APP_URL } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';

// Places people share to, most-used first. Each opens the service's own share page in a new tab.
const TARGETS: { label: string; href: (url: string, title: string) => string }[] = [
    { label: 'WhatsApp', href: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: 'X', href: (url, title) => `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: 'Facebook', href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: 'Telegram', href: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: 'LinkedIn', href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: 'Email', href: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}` },
];

// Our own share menu, the same on every device: copy the link, send it to a common app, or hand it to the device's
// share sheet ("More options", where the browser has one). In a page's top bar it drops the chevron, and its label on phones.
export function ShareButton({ path, title, inBar = false }: { path: string; title: string; inBar?: boolean }) {
    const [copied, setCopied] = useState(false);
    const [canShareNatively, setCanShareNatively] = useState(false);

    // The menu's links are built during render, which also happens on the server (where there's no window)
    const url = () => new URL(path, typeof window === 'undefined' ? APP_URL : window.location.origin).toString();

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

    async function shareNatively() {
        try {
            await navigator.share({ title, url: url() });
            trackEvent('share', { channel: 'native' });
        } catch {
            // The user closed the share sheet
        }
    }

    return (
        <Dropdown onOpenChange={(open) => open && setCanShareNatively(typeof navigator.share === 'function')}>
            <DropdownTrigger asChild>
                {inBar ? (
                    <Button variant="ghost" size="sm" aria-label="Share" className="h-8 gap-1.5 px-2 font-semibold text-muted hover:text-text sm:px-2.5">
                        {copied ? <Check className="size-4" /> : <Share className="size-4" />}
                        <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm" className="group relative z-10 h-7 gap-1 px-2 font-semibold text-subtle hover:text-text">
                        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
                        {copied ? 'Copied' : 'Share'}
                        <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
                    </Button>
                )}
            </DropdownTrigger>
            <DropdownContent align={inBar ? 'end' : 'start'} className="w-52">
                <DropdownItem onSelect={copyLink}>
                    <Link2 /> Copy link
                </DropdownItem>
                <DropdownSeparator />
                {TARGETS.map((target) => (
                    <DropdownItem key={target.label} asChild>
                        <a
                            href={target.href(url(), title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('share', { channel: target.label.toLowerCase() })}
                        >
                            {target.label === 'Email' ? <Mail /> : <Send />} {target.label}
                        </a>
                    </DropdownItem>
                ))}
                {canShareNatively && (
                    <>
                        <DropdownSeparator />
                        <DropdownItem onSelect={shareNatively}>
                            <Ellipsis /> More options…
                        </DropdownItem>
                    </>
                )}
            </DropdownContent>
        </Dropdown>
    );
}

export default ShareButton;
