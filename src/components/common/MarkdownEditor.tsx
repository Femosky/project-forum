'use client';

import { useRef, useState } from 'react';
import { Bold, Code, Italic, Link2, List, Quote } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import TextArea from '@/components/ui/TextArea';
import IconButton from '@/components/ui/IconButton';
import Markdown from './Markdown';

type Format = { label: string; icon: typeof Bold } & (
    | { wrap: [string, string]; placeholder: string }
    | { linePrefix: string }
);

const FORMATS: Format[] = [
    { label: 'Bold', icon: Bold, wrap: ['**', '**'], placeholder: 'bold text' },
    { label: 'Italic', icon: Italic, wrap: ['*', '*'], placeholder: 'italic text' },
    { label: 'Link', icon: Link2, wrap: ['[', '](https://)'], placeholder: 'link text' },
    { label: 'Quote', icon: Quote, linePrefix: '> ' },
    { label: 'Code', icon: Code, wrap: ['`', '`'], placeholder: 'code' },
    { label: 'List', icon: List, linePrefix: '- ' },
];

type MarkdownEditorProps = {
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    invalid?: boolean;
    autoFocus?: boolean;
    className?: string;
};

// Textarea with a small formatting toolbar and a Write/Preview switch. The toolbar only inserts Markdown,
// so typing the symbols by hand works the same.
export function MarkdownEditor({ name, value, onChange, placeholder, maxLength, invalid, autoFocus, className }: MarkdownEditorProps) {
    const [isPreview, setIsPreview] = useState(false);
    const textarea = useRef<HTMLTextAreaElement>(null);

    function apply(format: Format) {
        const element = textarea.current;
        if (!element) return;
        const { selectionStart: start, selectionEnd: end } = element;
        const selected = value.slice(start, end);
        let insert: string;
        let cursor: [number, number];

        if ('wrap' in format) {
            const text = selected || format.placeholder;
            insert = `${format.wrap[0]}${text}${format.wrap[1]}`;
            cursor = [start + format.wrap[0].length, start + format.wrap[0].length + text.length];
        } else {
            // Prefix every selected line, starting from the beginning of the first one
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const block = value.slice(lineStart, end);
            insert = block
                .split('\n')
                .map((line) => `${format.linePrefix}${line}`)
                .join('\n');
            onChange(value.slice(0, lineStart) + insert + value.slice(end));
            requestAnimationFrame(() => {
                element.focus();
                element.setSelectionRange(lineStart + insert.length, lineStart + insert.length);
            });
            return;
        }

        onChange(value.slice(0, start) + insert + value.slice(end));
        requestAnimationFrame(() => {
            element.focus();
            element.setSelectionRange(cursor[0], cursor[1]);
        });
    }

    return (
        <div
            className={twMerge(
                'flex flex-col rounded-lg border bg-surface focus-within:ring-2 focus-within:ring-focus/40',
                invalid ? 'border-danger' : 'border-border-strong focus-within:border-focus',
                className
            )}
        >
            <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1">
                {FORMATS.map((format) => (
                    <IconButton
                        key={format.label}
                        size="sm"
                        aria-label={format.label}
                        title={format.label}
                        onClick={() => apply(format)}
                        disabled={isPreview}
                        className="[&_svg]:size-4"
                    >
                        <format.icon />
                    </IconButton>
                ))}
                <div className="ml-auto flex gap-0.5 text-xs font-semibold">
                    {(['Write', 'Preview'] as const).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            aria-pressed={(tab === 'Preview') === isPreview}
                            onClick={() => setIsPreview(tab === 'Preview')}
                            className={twMerge(
                                'h-7 cursor-pointer rounded-lg px-2.5 transition-colors',
                                (tab === 'Preview') === isPreview ? 'bg-surface-muted text-text' : 'text-muted hover:text-text'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {isPreview ? (
                <div className="min-h-40 px-4 py-3">
                    {value.trim() ? <Markdown text={value} /> : <p className="text-muted">Nothing to preview yet.</p>}
                </div>
            ) : (
                <TextArea
                    ref={textarea}
                    variant="bare"
                    name={name}
                    aria-label={placeholder}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    autoFocus={autoFocus}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="min-h-40 px-4 py-3"
                />
            )}
        </div>
    );
}

export default MarkdownEditor;
