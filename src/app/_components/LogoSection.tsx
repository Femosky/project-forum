import { LOGO_TEXT } from '@/lib/constants';
import Link from 'next/link';

// The mark: a bare Yarner in the brand red. Drawn inline (no image request) so it follows light and dark mode.
// src/app/favicon.ico, icon.png, apple-icon.png and public/icon-*.png show the same drawing on a white tile.
export function LogoMark({ className }: { className?: string }) {
    return (
        <svg viewBox="26 8 68 108" aria-hidden className={className}>
            <path
                d="M28.6 44.8C28.6 22 41.8 9.5 59.8 9.5C77.8 9.5 91 22 91 44.8V90.4C91 105.2 77.8 113.2 59.8 113.2C41.8 113.2 28.6 105.2 28.6 90.4Z"
                fill="var(--brand)"
            />
            <ellipse cx="63" cy="42" rx="5" ry="6.8" fill="#fff" />
            <ellipse cx="81" cy="42" rx="4.4" ry="6.8" fill="#fff" />
            <path d="M65 59Q72 65 79 59" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </svg>
    );
}

export function LogoSection() {
    return (
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg">
            <LogoMark className="h-7 w-auto" />
            <span className="text-[20px] font-semibold tracking-tight">{LOGO_TEXT}</span>
        </Link>
    );
}

export default LogoSection;
