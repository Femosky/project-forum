// Reopens the cookie choices (footer, policies). A plain button: CookieGate, which is on every page, handles clicks
// on anything marked data-consent-choice, so this needs no JavaScript of its own.
export default function CookieSettingsButton({ className }: { className?: string }) {
    return (
        <button type="button" data-consent-choice="choose" className={className}>
            Cookie settings
        </button>
    );
}
