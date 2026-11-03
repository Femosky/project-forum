'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api/client';

// Owners: one test error from this browser and one from the API, to check that both reach Sentry
export function ErrorTest() {
    const [sent, setSent] = useState<string | null>(null);

    function fromBrowser() {
        // Thrown outside React so it reaches the window's error event, like a real uncaught error
        setTimeout(() => {
            throw new Error('Test error from the website (admin panel button)');
        });
        setSent(process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Website test error sent.' : 'Not sent: NEXT_PUBLIC_SENTRY_DSN isn’t set for this build.');
    }

    async function fromApi() {
        // The API answers 500 on purpose; reporting it to Sentry is its job
        await api('/admin/auth/test-error', { method: 'POST' }).catch(() => undefined);
        setSent('API test error sent. If SENTRY_DSN isn’t set on the API, it only went to the logs.');
    }

    return (
        <section className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold">Error alerts</h2>
            <p className="text-sm text-muted">Send a test error to Sentry. It shows up under Issues within a minute.</p>
            <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={fromBrowser}>
                    Test website error
                </Button>
                <Button variant="secondary" size="sm" onClick={fromApi}>
                    Test API error
                </Button>
            </div>
            {sent && (
                <p className="text-sm text-muted" role="status">
                    {sent}
                </p>
            )}
        </section>
    );
}

export default ErrorTest;
