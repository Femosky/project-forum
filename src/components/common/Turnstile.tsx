'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api/errors';

// Cloudflare Turnstile, the bot check on signup, password reset, repeated failed logins and a new account's first
// posts. The script only loads on pages that render this. Without NEXT_PUBLIC_TURNSTILE_SITE_KEY it renders nothing
// and forms send no token (the API skips the check when it has no secret either).

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const isTurnstileEnabled = Boolean(SITE_KEY);

// API error codes that mean "show the check and try again"
export const CHALLENGE_CODES = ['captcha_required', 'captcha_failed'];

type TurnstileApi = {
    render: (element: HTMLElement, options: Record<string, unknown>) => string;
    remove: (id: string) => void;
};
declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

let script: Promise<void> | null = null;
function loadScript() {
    script ??= new Promise<void>((resolve, reject) => {
        const element = document.createElement('script');
        element.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        element.async = true;
        element.onload = () => resolve();
        element.onerror = () => {
            script = null;
            reject(new Error('Turnstile failed to load'));
        };
        document.head.appendChild(element);
    });
    return script;
}

// A token works once: after a failed submit, bump resetKey for a fresh check
export default function Turnstile({ onToken, resetKey = 0 }: { onToken: (token: string | undefined) => void; resetKey?: number }) {
    const container = useRef<HTMLDivElement>(null);
    const callback = useRef(onToken);
    useEffect(() => {
        callback.current = onToken;
    });

    useEffect(() => {
        if (!SITE_KEY) return;
        let id: string | undefined;
        let cancelled = false;
        callback.current(undefined);
        loadScript()
            .then(() => {
                if (cancelled || !container.current || !window.turnstile) return;
                id = window.turnstile.render(container.current, {
                    sitekey: SITE_KEY,
                    size: 'flexible',
                    callback: (token: string) => callback.current(token),
                    'expired-callback': () => callback.current(undefined),
                    'error-callback': () => callback.current(undefined),
                });
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
            if (id) window.turnstile?.remove(id);
        };
    }, [resetKey]);

    if (!SITE_KEY) return null;
    // Reserves the widget's height so the form doesn't jump when it appears
    return <div ref={container} className="min-h-[65px]" />;
}

// A form's bot check. Shown from the start (signup, password reset) or only once the API asks for it (repeated
// failed logins, a new account's first posts).
export function useChallenge(shownFromStart: boolean) {
    const [isShown, setIsShown] = useState(shownFromStart && isTurnstileEnabled);
    const [token, setToken] = useState<string>();
    const [resetKey, setResetKey] = useState(0);

    return {
        token,
        // True while the check is on screen but not passed yet
        isPending: isShown && !token,
        widget: isShown ? <Turnstile onToken={setToken} resetKey={resetKey} /> : null,
        // Call after a failed submit: a token works once, and the API may have just asked for the check
        afterError(error: unknown) {
            if (isShown) setResetKey((key) => key + 1);
            if (isTurnstileEnabled && error instanceof ApiError && CHALLENGE_CODES.includes(error.code)) setIsShown(true);
        },
    };
}
