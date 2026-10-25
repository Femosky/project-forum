'use client';

import { KeyboardEvent, ReactNode, useRef, useState } from 'react';
import {
    Bold,
    Code,
    EyeOff,
    Heading,
    Italic,
    Link2,
    List,
    ListOrdered,
    Quote,
    Strikethrough,
    Subscript,
    Superscript,
    Table,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import TextArea from '@/components/ui/TextArea';
import Button from '@/components/ui/Button';
import Markdown from './Markdown';

// Ctrl on Windows and Linux, ⌘ on Apple devices, for the shortcut hints
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

type Wrap = { kind: 'wrap'; before: string; after: string; placeholder: string };
type Line = { kind: 'line'; prefix: string | ((index: number) => string) };
type Tool = { id: string; label: string; icon: typeof Bold; shortcut?: string } & (Wrap | Line | { kind: 'link' } | { kind: 'table' });

// The toolbar only inserts Markdown, so typing the symbols by hand works the same (see Markdown.tsx for the syntax)
const TOOLS: Tool[][] = [
    [
        { id: 'bold', label: 'Bold', icon: Bold, shortcut: 'B', kind: 'wrap', before: '**', after: '**', placeholder: 'bold text' },
        { id: 'italic', label: 'Italic', icon: Italic, shortcut: 'I', kind: 'wrap', before: '*', after: '*', placeholder: 'italic text' },
        { id: 'strike', label: 'Strikethrough', icon: Strikethrough, shortcut: 'Shift+X', kind: 'wrap', before: '~~', after: '~~', placeholder: 'struck text' },
        { id: 'sup', label: 'Superscript', icon: Superscript, kind: 'wrap', before: '^(', after: ')', placeholder: 'superscript' },
        { id: 'sub', label: 'Subscript', icon: Subscript, kind: 'wrap', before: '~(', after: ')', placeholder: 'subscript' },
        { id: 'code', label: 'Inline code', icon: Code, shortcut: 'E', kind: 'wrap', before: '`', after: '`', placeholder: 'code' },
        { id: 'spoiler', label: 'Spoiler', icon: EyeOff, kind: 'wrap', before: '>!', after: '!<', placeholder: 'hidden text' },
    ],
    [
        { id: 'link', label: 'Link', icon: Link2, shortcut: 'K', kind: 'link' },
        { id: 'heading', label: 'Heading', icon: Heading, kind: 'line', prefix: '## ' },
        { id: 'bullets', label: 'Bulleted list', icon: List, shortcut: 'Shift+8', kind: 'line', prefix: '- ' },
        { id: 'numbers', label: 'Numbered list', icon: ListOrdered, shortcut: 'Shift+7', kind: 'line', prefix: (index) => `${index + 1}. ` },
        { id: 'quote', label: 'Quote', icon: Quote, shortcut: 'Shift+9', kind: 'line', prefix: '> ' },
        { id: 'table', label: 'Table', icon: Table, kind: 'table' },
    ],
];
const ALL_TOOLS = TOOLS.flat();

const TABLE_TEMPLATE = '| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |\n| Cell | Cell |';
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
    // compact: replies (shorter box, no Write/Preview switch)
    variant?: 'full' | 'compact';
    // ⌘/Ctrl+Enter, e.g. send a reply
    onSubmitShortcut?: () => void;
    // Buttons shown under the text, inside the box (Cancel, Reply)
    footer?: ReactNode;
    className?: string;
};

// Textarea with a formatting toolbar, keyboard shortcuts (⌘B, ⌘I, ⌘K...), lists that continue on Enter, a small
// link dialog, and a Write/Preview switch.
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
    const [isPreview, setIsPreview] = useState(false);
    const [linkDraft, setLinkDraft] = useState<{ text: string; url: string; start: number; end: number } | null>(null);
    const textarea = useRef<HTMLTextAreaElement>(null);
    const isCompact = variant === 'compact';

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

        if (tool.kind === 'wrap') {
            // Pressing it again on already-formatted text removes the formatting
            const before = value.slice(start - tool.before.length, start);
            const after = value.slice(end, end + tool.after.length);
            if (selected && before === tool.before && after === tool.after) {
                replace(start - tool.before.length, end + tool.after.length, selected, start - tool.before.length, end - tool.before.length);
                return;
            }
            const text = selected || tool.placeholder;
            const from = start + tool.before.length;
            replace(start, end, `${tool.before}${text}${tool.after}`, from, from + text.length);
        } else if (tool.kind === 'line') {
            // Prefix every selected line, starting from the beginning of the first one; a second press removes it
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lines = value.slice(lineStart, end).split('\n');
            const prefixOf = (index: number) => (typeof tool.prefix === 'function' ? tool.prefix(index) : tool.prefix);
            const isOn = lines.every((line, index) => line.startsWith(prefixOf(index)));
            const block = lines.map((line, index) => (isOn ? line.slice(prefixOf(index).length) : `${prefixOf(index)}${line}`)).join('\n');
            replace(lineStart, end, block, lineStart + block.length);
        } else if (tool.kind === 'link') {
            const looksLikeUrl = /^https?:\/\//.test(selected);
            setLinkDraft({ text: looksLikeUrl ? '' : selected, url: looksLikeUrl ? selected : '', start, end });
        } else {
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const needsBreak = start > 0 && value[start - 1] !== '\n' ? '\n\n' : start > lineStart ? '\n' : '';
            const insert = `${needsBreak}${TABLE_TEMPLATE}\n`;
            replace(start, end, insert, start + needsBreak.length + 2, start + needsBreak.length + 10);
        }
    }

    function insertLink() {
        if (!linkDraft) return;
        const url = /^https?:\/\//i.test(linkDraft.url.trim()) ? linkDraft.url.trim() : `https://${linkDraft.url.trim()}`;
        const text = linkDraft.text.trim() || url;
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

    return (
        <div
            className={twMerge(
                'relative flex flex-col rounded-[10px] border bg-surface transition-[border-color,box-shadow] focus-within:ring-4 focus-within:ring-active',
                invalid ? 'border-danger' : 'border-border-strong focus-within:border-muted',
                className
            )}
        >
            <div className="flex items-center gap-1 border-b border-border px-1.5 py-1">
                <div role="toolbar" aria-label="Formatting" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
                    {TOOLS.map((group, groupIndex) => (
                        <div key={groupIndex} className="flex shrink-0 items-center gap-0.5">
                            {groupIndex > 0 && <span aria-hidden className="mx-1 h-4 w-px bg-border" />}
                            {group.map((tool) => {
                                const hint = tool.shortcut ? `${tool.label} (${MOD}${tool.shortcut})` : tool.label;
                                return (
                                    <button
                                        key={tool.id}
                                        type="button"
                                        aria-label={hint}
                                        title={hint}
                                        disabled={isPreview}
                                        // Keep the text selection while clicking a tool
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => apply(tool)}
                                        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <tool.icon className="size-4" />
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
                {!isCompact && (
                    <div className="flex shrink-0 gap-0.5 rounded-lg p-0.5 text-xs font-semibold ring-1 ring-inset ring-border">
                        {(['Write', 'Preview'] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                aria-pressed={(tab === 'Preview') === isPreview}
                                onClick={() => setIsPreview(tab === 'Preview')}
                                className={twMerge(
                                    'h-6 cursor-pointer rounded-md px-2 transition-colors',
                                    (tab === 'Preview') === isPreview ? 'bg-active text-text' : 'text-muted hover:text-text'
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {linkDraft && (
                // The link dialog: what to show and where it goes
                <div
                    role="dialog"
                    aria-label="Add a link"
                    className="absolute left-2 right-2 top-11 z-20 flex flex-col gap-2 rounded-[10px] bg-surface-raised p-3 shadow-raised sm:right-auto sm:w-80"
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            setLinkDraft(null);
                            textarea.current?.focus();
                        }
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            insertLink();
                        }
                    }}
                >
                    <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                        Text
                        <input
                            id={`${name}-link-text`}
                            value={linkDraft.text}
                            onChange={(event) => setLinkDraft({ ...linkDraft, text: event.target.value })}
                            placeholder="What people will see"
                            autoFocus={!linkDraft.text}
                            className="h-8 rounded-[7px] border border-border-strong bg-surface px-2.5 text-sm font-normal text-text outline-none focus:border-muted"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                        Link
                        <input
                            id={`${name}-link-url`}
                            value={linkDraft.url}
                            onChange={(event) => setLinkDraft({ ...linkDraft, url: event.target.value })}
                            placeholder="https://"
                            inputMode="url"
                            autoFocus={Boolean(linkDraft.text)}
                            className="h-8 rounded-[7px] border border-border-strong bg-surface px-2.5 text-sm font-normal text-text outline-none focus:border-muted"
                        />
                    </label>
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setLinkDraft(null)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={insertLink} disabled={!linkDraft.url.trim()}>
                            Add link
                        </Button>
                    </div>
                </div>
            )}

            {isPreview ? (
                <div className={twMerge('px-3 py-2.5', isCompact ? 'min-h-24' : 'min-h-40')}>
                    {value.trim() ? <Markdown text={value} className="text-[15px] leading-6 text-body" /> : <p className="text-subtle">Nothing to preview yet.</p>}
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
                    onKeyDown={handleKeyDown}
                    className={twMerge('px-3 py-2.5', isCompact ? 'min-h-24' : 'min-h-40')}
                />
            )}

            {footer && <div className="flex items-center justify-end gap-2 px-2 pb-2">{footer}</div>}
        </div>
    );
}

export default MarkdownEditor;
