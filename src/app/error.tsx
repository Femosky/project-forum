'use client';

import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { reportError } from '@/lib/errorReport';

// A page that crashes while rendering in the browser. React hands the error to this boundary instead of the window's
// error event, so ErrorReporter never sees it and it's reported here. Server errors arrive with only a digest (their
// details went to Sentry from instrumentation.ts), so those aren't sent twice.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        if (!error.digest) reportError(error, { runtime: 'browser', path: location.pathname });
    }, [error]);

    return (
        <EmptyState
            icon={<TriangleAlert />}
            title="Something went wrong"
            description="This page hit a problem. Try again, and if it keeps happening, come back in a little while."
            action={<Button onClick={reset}>Try again</Button>}
            className="py-24"
        />
    );
}
