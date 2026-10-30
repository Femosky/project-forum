// A labelled field with one message line under it: the error when there is one, otherwise the hint. The line keeps
// its height so messages appearing never push the form around, and it's announced to screen readers.
export const messageId = (name: string) => `${name}-message`;

export function FormField({
    name,
    label,
    error,
    hint,
    aside,
    children,
}: {
    name: string;
    label: string;
    error?: string;
    hint?: React.ReactNode;
    aside?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
                <label htmlFor={name} className="text-sm font-semibold">
                    {label}
                </label>
                {aside}
            </div>
            {children}
            <p id={messageId(name)} aria-live="polite" className={`min-h-4 text-xs ${error ? 'text-danger' : 'text-muted'}`}>
                {error ?? hint}
            </p>
        </div>
    );
}

// Props that tie an input to its field's message
export const describedBy = (name: string, error?: string) =>
    ({ name, 'aria-describedby': messageId(name), outline: error ? 'error' : 'default' }) as const;
