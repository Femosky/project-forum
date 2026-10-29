import Link from 'next/link';
import { buttonStyles } from '@/components/ui/Button';

// The cookie banner's first view, in the page's own HTML: it paints with the page (so it never becomes a late
// "largest paint"), it's the same for every guest (so cached pages stay shareable), and it costs no JavaScript.
// The inline script in the layout marks <html data-consent> before the first paint when the reader has already
// answered, and CSS then hides this. CookieGate makes the buttons work and opens the "Choose" panel.
export default function CookieNotice() {
    return (
        <div
            id="cookie-notice"
            role="region"
            aria-label="Cookie choices"
            className="cookie-notice fixed inset-x-0 bottom-16 z-50 mx-auto flex max-w-content flex-col gap-3 border border-border bg-surface-raised p-4 text-sm shadow-raised sm:bottom-4 sm:rounded-xl md:flex-row md:items-center"
        >
            <p className="flex-1 text-muted">
                We use cookies to keep you signed in. With your OK we also count visits and let Google show ads that match your
                interests.{' '}
                <Link href="/policies/cookies" className="font-semibold text-link hover:underline">
                    Cookie policy
                </Link>
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" data-consent-choice="choose" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                    Choose
                </button>
                <button type="button" data-consent-choice="reject" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                    Reject all
                </button>
                <button type="button" data-consent-choice="accept" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                    Accept all
                </button>
            </div>
        </div>
    );
}
