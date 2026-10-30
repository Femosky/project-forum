'use client';

import { ComponentType, ComponentProps, KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import TextArea from '@/components/ui/TextArea';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { LinkDraft, LinkPopover, Tool, TOOLS, ToolGroups } from './editorTools';

type RichEditorComponent = ComponentType<ComponentProps<typeof import('./RichEditor').default>>;

const MODE_KEY = 'editor_mode';
const ALL_TOOLS = TOOLS.flat();
// The Markdown each toolbar button types in the Markdown box (see Markdown.tsx for the syntax)
const WRAPS: Record<string, { before: string; after: string; placeholder: string }> = {
    bold: { before: '**', after: '**', placeholder: 'bold text' },
    italic: { before: '*', after: '*', placeholder: 'italic text' },
    strike: { before: '~~', after: '~~', placeholder: 'struck text' },
    sup: { before: '^(', after: ')', placeholder: 'superscript' },
    sub: { before: '~(', after: ')', placeholder: 'subscript' },
    code: { before: '`', after: '`', placeholder: 'code' },
    spoiler: { before: '>!', after: '!<', placeholder: 'hidden text' },
};
const LINES: Record<string, string | ((index: number) => string)> = {
    heading: '## ',
    bullets: '- ',
    numbers: (index) => `${index + 1}. `,
    quote: '> ',
};
const NEW_TABLE = '|  |  |  |\n| --- | --- | --- |\n|  |  |  |\n|  |  |  |';

// A list or quote line: indentation, the marker, and what follows it
const CONTINUED_LINE = /^(\s*)([-*+]|\d+[.)]|>)(\s+)(.*)$/;

type MarkdownEditorProps = {
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    invalid?: boolean;
    autoFocus?: boolean;
    // compact: replies (shorter box)
    variant?: 'full' | 'compact';
    // ⌘/Ctrl+Enter, e.g. send a reply
    onSubmitShortcut?: () => void;
    // Buttons shown under the text, inside the box (Cancel, Reply)
    footer?: ReactNode;
    className?: string;
};

// The post and reply box. Rich text by default: what you type looks as it will be posted (RichEditor, loaded when the
// box opens). The ••• menu switches to a plain Markdown box with the same toolbar and shortcuts, and that choice is
// remembered. Either way the value is Markdown.
export function MarkdownEditor({
    name,
    value,
    onChange,
    placeholder,
    maxLength,
    invalid,
    autoFocus,
    variant = 'full',
    onSubmitShortcut,
    footer,
    className,
}: MarkdownEditorProps) {
    const [mode, setMode] = useState<'rich' | 'markdown'>('rich');
    const [RichEditor, setRichEditor] = useState<RichEditorComponent | null>(null);
    const [linkDraft, setLinkDraft] = useState<(LinkDraft & { start: number; end: number }) | null>(null);
    const textarea = useRef<HTMLTextAreaElement>(null);
    const isCompact = variant === 'compact';
    const minHeight = isCompact ? 'min-h-24' : 'min-h-40';

    useEffect(() => {
        let isCurrent = true;
        void import('./RichEditor')
            .then((loaded) => isCurrent && setRichEditor(() => loaded.default))
            // Can't load it (offline, say): the Markdown box still works
            .catch(() => isCurrent && setMode('markdown'));
        try {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- only known in the browser, after hydration
            if (localStorage.getItem(MODE_KEY) === 'markdown') setMode('markdown');
        } catch {
            // Storage blocked: rich text
        }
        return () => {
            isCurrent = false;
        };
    }, []);

    function switchMode() {
        const next = mode === 'rich' ? 'markdown' : 'rich';
        setMode(next);
        try {
            localStorage.setItem(MODE_KEY, next);
        } catch {
            // Lasts until the next visit
        }
    }

    // Replace value[start..end] with text, then select [selStart, selEnd] (relative to the whole new value)
    function replace(start: number, end: number, text: string, selStart: number, selEnd = selStart) {
        onChange(value.slice(0, start) + text + value.slice(end));
        requestAnimationFrame(() => {
            textarea.current?.focus();
            textarea.current?.setSelectionRange(selStart, selEnd);
        });
    }

    function apply(tool: Tool) {
        const element = textarea.current;
        if (!element) return;
        const { selectionStart: start, selectionEnd: end } = element;
        const selected = value.slice(start, end);
        const wrapped = WRAPS[tool.id];
        const line = LINES[tool.id];

        if (wrapped) {
            // Pressing it again on already-formatted text removes the formatting
            const before = value.slice(start - wrapped.before.length, start);
            const after = value.slice(end, end + wrapped.after.length);
            if (selected && before === wrapped.before && after === wrapped.after) {
                replace(start - wrapped.before.length, end + wrapped.after.length, selected, start - wrapped.before.length, end - wrapped.before.length);
                return;
            }
            const text = selected || wrapped.placeholder;
            const from = start + wrapped.before.length;
            replace(start, end, `${wrapped.before}${text}${wrapped.after}`, from, from + text.length);
        } else if (line) {
            // Prefix every selected line, starting from the beginning of the first one; a second press removes it
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lines = value.slice(lineStart, end).split('\n');
            const prefixOf = (index: number) => (typeof line === 'function' ? line(index) : line);
            const isOn = lines.every((text, index) => text.startsWith(prefixOf(index)));
            const block = lines.map((text, index) => (isOn ? text.slice(prefixOf(index).length) : `${prefixOf(index)}${text}`)).join('\n');
            replace(lineStart, end, block, lineStart + block.length);
        } else if (tool.id === 'link') {
            const looksLikeUrl = /^https?:\/\//.test(selected);
            setLinkDraft({ text: looksLikeUrl ? '' : selected, url: looksLikeUrl ? selected : '', showText: true, start, end });
        } else if (tool.id === 'table') {
            // A table needs a blank line before it and after it
            const head = value.slice(0, start);
            const before = !head || head.endsWith('\n\n') ? '' : head.endsWith('\n') ? '\n' : '\n\n';
            const after = value.slice(end).startsWith('\n') ? '\n' : '\n\n';
            const insert = `${before}${NEW_TABLE}${after}`;
            replace(start, end, insert, start + insert.length);
        }
    }

    function insertLink({ text, url }: { text: string; url: string }) {
        if (!linkDraft) return;
        const markdown = `[${text}](${url})`;
        setLinkDraft(null);
        replace(linkDraft.start, linkDraft.end, markdown, linkDraft.start + markdown.length);
    }

    // Enter inside a list or quote starts the next item (numbers count up); Enter on an empty item ends the list
    function continueList(event: KeyboardEvent<HTMLTextAreaElement>) {
        const element = event.currentTarget;
        const { selectionStart: start, selectionEnd: end } = element;
        if (start !== end) return false;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const line = value.slice(lineStart, start);
        const match = line.match(CONTINUED_LINE);
        if (!match) return false;
        const [, indent, marker, space, content] = match;
        event.preventDefault();
        if (content.trim() === '') {
            replace(lineStart, start, '', lineStart);
            return true;
        }
        const numbered = marker.match(/^(\d+)([.)])$/);
        const next = numbered ? `${Number(numbered[1]) + 1}${numbered[2]}` : marker;
        const insert = `\n${indent}${next}${space}`;
        replace(start, end, insert, start + insert.length);
        return true;
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        const mod = event.metaKey || event.ctrlKey;
        if (event.key === 'Enter' && mod) {
            if (onSubmitShortcut) {
                event.preventDefault();
                onSubmitShortcut();
            }
            return;
        }
        if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !mod) {
            continueList(event);
            return;
        }
        if (!mod || event.altKey) return;
        const key = event.key.toLowerCase();
        const shortcut = event.shiftKey ? `Shift+${event.code.startsWith('Digit') ? event.code.slice(5) : key.toUpperCase()}` : key.toUpperCase();
        const tool = ALL_TOOLS.find((candidate) => candidate.shortcut === shortcut);
        if (tool) {
            event.preventDefault();
            apply(tool);
        }
    }

    const menu = (
        <Dropdown>
            <DropdownTrigger asChild>
                <button
                    type="button"
                    aria-label="Editor options"
                    title="Editor options"
                    className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-text"
                >
                    <Ellipsis className="size-4" />
                </button>
            </DropdownTrigger>
            <DropdownContent align="end">
                <DropdownItem onSelect={switchMode}>{mode === 'rich' ? 'Switch to Markdown' : 'Switch to rich text'}</DropdownItem>
            </DropdownContent>
        </Dropdown>
    );

    return (
        <div
            className={twMerge(
                'relative flex flex-col rounded-[10px] border bg-surface transition-[border-color,box-shadow] focus-within:ring-4 focus-within:ring-active',
                invalid ? 'border-danger' : 'border-border-strong focus-within:border-muted',
                className
            )}
        >
            {mode === 'rich' && RichEditor ? (
                <RichEditor
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    label={placeholder}
                    maxLength={maxLength}
                    autoFocus={autoFocus}
                    minHeightClass={minHeight}
                    onSubmitShortcut={onSubmitShortcut}
                    menu={menu}
                />
            ) : mode === 'rich' ? (
                // Same size as the editor, for the moment it takes to load
                <>
                    <div className="h-9 border-b border-border" />
                    <div className={twMerge('px-3 py-2.5 text-[15px] leading-6 text-subtle', minHeight)}>{placeholder}</div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-1 border-b border-border px-1.5 py-1">
                        <ToolGroups groups={TOOLS} onApply={apply} />
                        {menu}
                    </div>
                    {linkDraft && (
                        <LinkPopover
                            draft={linkDraft}
                            onCancel={() => {
                                setLinkDraft(null);
                                textarea.current?.focus();
                            }}
                            onSave={insertLink}
                        />
                    )}
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
                        onKeyDown={handleKeyDown}
                        className={twMerge('px-3 py-2.5', minHeight)}
                    />
                </>
            )}

            {footer && <div className="flex items-center justify-end gap-2 px-2 pb-2">{footer}</div>}
        </div>
    );
}

export default MarkdownEditor;
