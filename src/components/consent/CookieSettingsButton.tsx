'use client';

import { openCookieSettings } from '@/lib/consent';

// Reopens the cookie banner with its choices (footer, policies)
export default function CookieSettingsButton({ className }: { className?: string }) {
    return (
        <button type="button" onClick={openCookieSettings} className={className}>
            Cookie settings
        </button>
    );
}
