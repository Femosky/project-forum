import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';

// The mark: the brand ring on the accent colour. Drawn inline (no image request) so it follows light and dark mode.
// src/app/favicon.ico, icon.png and apple-icon.png are the same drawing in navy.
export function LogoMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" aria-hidden className={className}>
            <rect width="32" height="32" rx="9" fill="var(--accent)" />
            <circle cx="16" cy="16" r="6.5" fill="none" stroke="var(--accent-fg)" strokeWidth="4.5" />
        </svg>
    );
}

export function LogoSection() {
    return (
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg">
            <LogoMark className="size-8" />
            <span className="hidden text-lg font-extrabold tracking-tight sm:inline">{APP_NAME}</span>
            <span className="sr-only sm:hidden">{APP_NAME}</span>
        </Link>
    );
}

export default LogoSection;
