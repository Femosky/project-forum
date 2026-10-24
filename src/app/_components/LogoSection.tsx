import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';

// The mark: two panes side by side, the split view the app is built around. Drawn inline (no image request) and
// coloured from the theme tokens. src/app/favicon.ico and src/app/icon.png are the same drawing.
export function LogoMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" aria-hidden className={className}>
            <rect width="32" height="32" rx="9" fill="var(--text)" />
            <rect x="7" y="8" width="7" height="16" rx="2.5" fill="var(--accent)" />
            <rect x="16.5" y="8" width="8.5" height="16" rx="2.5" fill="var(--bg)" />
        </svg>
    );
}

export function LogoSection() {
    return (
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg">
            <LogoMark className="size-7" />
            <span className="hidden text-[17px] font-extrabold tracking-tight sm:inline">{APP_NAME}</span>
            <span className="sr-only sm:hidden">{APP_NAME}</span>
        </Link>
    );
}

export default LogoSection;
