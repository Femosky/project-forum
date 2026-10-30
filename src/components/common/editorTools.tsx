import { ReactNode, useState } from 'react';
import { Bold, Code, EyeOff, Heading, Italic, Link2, List, ListOrdered, Quote, SquareCode, Strikethrough, Subscript, Superscript, Table } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';

// What the rich editor and the Markdown box share: the toolbar and the link box

// ⌘ on Apple devices, Ctrl+ elsewhere, for the shortcut hints
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

export type Tool = { id: string; label: string; icon: typeof Bold; shortcut?: string };

export const TOOLS: Tool[][] = [
    [
        { id: 'bold', label: 'Bold', icon: Bold, shortcut: 'B' },
        { id: 'italic', label: 'Italic', icon: Italic, shortcut: 'I' },
        { id: 'strike', label: 'Strikethrough', icon: Strikethrough, shortcut: 'Shift+X' },
        { id: 'sup', label: 'Superscript', icon: Superscript },
        { id: 'sub', label: 'Subscript', icon: Subscript },
        { id: 'code', label: 'Inline code', icon: Code, shortcut: 'E' },
        { id: 'spoiler', label: 'Spoiler', icon: EyeOff },
    ],
    [
        { id: 'link', label: 'Link', icon: Link2, shortcut: 'K' },
        { id: 'heading', label: 'Heading', icon: Heading },
        { id: 'bullets', label: 'Bulleted list', icon: List, shortcut: 'Shift+8' },
        { id: 'numbers', label: 'Numbered list', icon: ListOrdered, shortcut: 'Shift+7' },
        { id: 'quote', label: 'Quote', icon: Quote, shortcut: 'Shift+9' },
        { id: 'codeblock', label: 'Code block', icon: SquareCode, shortcut: 'Alt+C' },
        { id: 'table', label: 'Table', icon: Table },
    ],
];

type ToolbarButtonProps = { label: string; shortcut?: string; isActive?: boolean; onClick: () => void; className?: string; children: ReactNode };

export function ToolbarButton({ label, shortcut, isActive, onClick, className, children }: ToolbarButtonProps) {
    const hint = shortcut ? `${label} ${MOD}${shortcut}` : label;
    return (
        <button
            type="button"
            aria-label={hint}
            aria-pressed={isActive}
            title={hint}
            // Keep the text selection while clicking a tool
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={twMerge(
                'flex h-7 min-w-7 shrink-0 cursor-pointer items-center justify-center rounded-md px-1 text-muted transition-colors hover:bg-hover hover:text-text',
                isActive && 'bg-active text-text',
                className
            )}
        >
            {children}
        </button>
    );
}

export function ToolGroups({ groups, onApply, isActive }: { groups: Tool[][]; onApply: (tool: Tool) => void; isActive?: (tool: Tool) => boolean }) {
    return (
        <div role="toolbar" aria-label="Formatting" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
            {groups.map((group, index) => (
                <div key={index} className="flex shrink-0 items-center gap-0.5">
                    {index > 0 && <span aria-hidden className="mx-1 h-4 w-px bg-border" />}
                    {group.map((tool) => (
                        <ToolbarButton key={tool.id} label={tool.label} shortcut={tool.shortcut} isActive={isActive?.(tool)} onClick={() => onApply(tool)}>
                            <tool.icon className="size-4" />
                        </ToolbarButton>
                    ))}
                </div>
            ))}
        </div>
    );
}

export type LinkDraft = { text: string; url: string; showText: boolean };

const fieldClass = 'h-8 rounded-[7px] border border-border-strong bg-surface px-2.5 text-sm font-normal text-text outline-none focus:border-muted';

// The small box for adding a link: what to show and where it goes
export function LinkPopover({ draft, onSave, onCancel }: { draft: LinkDraft; onSave: (link: { text: string; url: string }) => void; onCancel: () => void }) {
    const [text, setText] = useState(draft.text);
    const [url, setUrl] = useState(draft.url);

    function save() {
        const target = url.trim();
        if (!target) return;
        const full = /^https?:\/\//i.test(target) ? target : `https://${target}`;
        onSave({ text: text.trim() || full, url: full });
    }

    return (
        <div
            role="dialog"
            aria-label="Add a link"
            className="absolute left-2 right-2 top-11 z-20 flex flex-col gap-2 rounded-[10px] bg-surface-raised p-3 shadow-raised sm:right-auto sm:w-80"
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    onCancel();
                }
                if (event.key === 'Enter') {
                    event.preventDefault();
                    save();
                }
            }}
        >
            {draft.showText && (
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                    Text
                    <input value={text} onChange={(event) => setText(event.target.value)} placeholder="What people will see" autoFocus className={fieldClass} />
                </label>
            )}
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                Link
                <input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://"
                    inputMode="url"
                    autoFocus={!draft.showText}
                    className={fieldClass}
                />
            </label>
            <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button size="sm" onClick={save} disabled={!url.trim()}>
                    Add link
                </Button>
            </div>
        </div>
    );
}
