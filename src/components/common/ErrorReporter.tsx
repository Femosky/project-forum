'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/errorReport';

// Uncaught errors and rejected promises in the browser. Errors from other sites' scripts (ads, the bot check) carry
// no details ("Script error.") and are skipped.
export default function ErrorReporter() {
    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
        const path = () => location.pathname;
        const onError = (event: ErrorEvent) => {
            if (event.error) reportError(event.error, { runtime: 'browser', path: path() });
        };
        const onRejection = (event: PromiseRejectionEvent) => reportError(event.reason, { runtime: 'browser', path: path() });
        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);
        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
        };
    }, []);
    return null;
}
