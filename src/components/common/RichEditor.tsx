'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { Editor, Extension, Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { ListItem } from '@tiptap/extension-list';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Placeholder } from '@tiptap/extensions';
import { selectedRect } from '@tiptap/pm/tables';
import { AlignCenter, AlignLeft, AlignRight, Columns3, Rows3, Trash2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { LinkPopover, LinkDraft, TOOLS, Tool, ToolbarButton, ToolGroups } from './editorTools';
import { DocNode, docToMarkdown, markdownToDoc } from './markdownDoc';

// The rich editor: what you type looks as it will be posted. The document is turned into the site's Markdown on every
// change (markdownDoc.ts), so storage and rendering don't depend on it. It carries a lot of code, so MarkdownEditor
// loads it when a composer opens. Only what the Markdown can hold is allowed: list items and table cells are one
// paragraph, so nothing typed here can disappear when it's saved.

const Spoiler = Mark.create({
    name: 'spoiler',
    parseHTML: () => [{ tag: 'span.spoiler' }],
    renderHTML: ({ HTMLAttributes }) => ['span', mergeAttributes(HTMLAttributes, { class: 'spoiler' }), 0],
});

const alignAttribute = {
    align: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.textAlign || null,
        renderHTML: ({ align }: { align?: string | null }) => (align ? { style: `text-align: ${align}` } : {}),
    },
};
const FlatListItem = ListItem.extend({ content: 'paragraph' });
const Cell = TableCell.extend({ content: 'paragraph', addAttributes() { return { ...this.parent?.(), ...alignAttribute }; } });
const HeaderCell = TableHeader.extend({ content: 'paragraph', addAttributes() { return { ...this.parent?.(), ...alignAttribute }; } });

// A spreadsheet copied as plain text: tab-separated lines become a table
function tableFromTabs(text: string): DocNode | null {
    const lines = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
    if (lines.length < 2 || !lines.every((line) => line.includes('\t'))) return null;
    const escape = (cell: string) => cell.trim().replace(/\|/g, '\\|');
    const rows = lines.map((line) => `| ${line.split('\t').map(escape).join(' | ')} |`);
    const rule = `| ${lines[0].split('\t').map(() => '---').join(' | ')} |`;
    return markdownToDoc([rows[0], rule, ...rows.slice(1)].join('\n')).content?.[0] ?? null;
}

function setColumnAlign(editor: Editor, align: string | null) {
    editor
        .chain()
        .focus()
        .command(({ state, tr, dispatch }) => {
            const rect = selectedRect(state);
            if (dispatch) {
                for (let row = 0; row < rect.map.height; row++) {
                    for (let column = rect.left; column < rect.right; column++) {
                        const position = rect.tableStart + rect.map.map[row * rect.map.width + column];
                        const cell = tr.doc.nodeAt(position);
                        if (cell) tr.setNodeMarkup(position, undefined, { ...cell.attrs, align });
                    }
                }
            }
            return true;
        })
        .run();
}

type RichEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    maxLength?: number;
    autoFocus?: boolean;
    minHeightClass: string;
    onSubmitShortcut?: () => void;
    // The ••• menu at the end of the toolbar
    menu: React.ReactNode;
};

export default function RichEditor({ value, onChange, placeholder, label, maxLength, autoFocus, minHeightClass, onSubmitShortcut, menu }: RichEditorProps) {
    const [linkDraft, setLinkDraft] = useState<LinkDraft | null>(null);
    // What the editor last produced, to tell the parent's own changes (a reset, a restored draft) from echoes of ours
    const lastMarkdown = useRef(value);
    const submit = useRef(onSubmitShortcut);
    useEffect(() => {
        submit.current = onSubmitShortcut;
    }, [onSubmitShortcut]);

    function openLink(current: Editor) {
        const { from, to, empty } = current.state.selection;
        const text = empty ? '' : current.state.doc.textBetween(from, to);
        const href = String(current.getAttributes('link').href ?? '');
        setLinkDraft({ text, url: href || (/^https?:\/\//.test(text) ? text : ''), showText: empty });
    }
    const openLinkRef = useRef(openLink);
    useEffect(() => {
        openLinkRef.current = openLink;
    });

    const editor = useEditor({
        immediatelyRender: false,
        autofocus: autoFocus ? 'end' : false,
        content: markdownToDoc(value),
        extensions: [
            StarterKit.configure({
                underline: false,
                listItem: false,
                link: { openOnClick: false, autolink: true, protocols: ['http', 'https'], HTMLAttributes: { rel: 'nofollow ugc noopener noreferrer', target: null } },
            }),
            FlatListItem,
            Spoiler,
            Subscript,
            Superscript,
            Table.configure({ resizable: false }),
            TableRow,
            Cell,
            HeaderCell,
            Placeholder.configure({ placeholder: placeholder ?? '' }),
            Extension.create({
                name: 'forumShortcuts',
                addKeyboardShortcuts: () => ({
                    'Mod-Enter': () => {
                        submit.current?.();
                        return Boolean(submit.current);
                    },
                    'Mod-k': ({ editor: current }) => {
                        openLinkRef.current(current);
                        return true;
                    },
                    'Mod-Shift-x': ({ editor: current }) => current.commands.toggleStrike(),
                    'Mod-Shift-9': ({ editor: current }) => current.commands.toggleBlockquote(),
                    // Lists don't nest in the site's Markdown, so Tab stays put in a list (in a table it moves between cells)
                    Tab: ({ editor: current }) => current.isActive('listItem'),
                    'Shift-Tab': ({ editor: current }) => current.isActive('listItem'),
                }),
            }),
        ],
        editorProps: {
            attributes: {
                role: 'textbox',
                'aria-multiline': 'true',
                ...(label ? { 'aria-label': label } : {}),
                class: twMerge('markdown break-words px-3 py-2.5 text-[15px] leading-6 text-body outline-none', minHeightClass),
            },
            handlePaste(view, event) {
                if (event.clipboardData?.getData('text/html')) return false;
                const table = tableFromTabs(event.clipboardData?.getData('text/plain') ?? '');
                if (!table) return false;
                view.dispatch(view.state.tr.replaceSelectionWith(view.state.schema.nodeFromJSON(table)).scrollIntoView());
                return true;
            },
        },
        onUpdate({ editor: current }) {
            const markdown = docToMarkdown(current.getJSON() as DocNode);
            if (maxLength && markdown.length > maxLength) {
                current.commands.undo();
                return;
            }
            lastMarkdown.current = markdown;
            onChange(markdown);
        },
    });

    useEffect(() => {
        if (editor && value !== lastMarkdown.current) {
            lastMarkdown.current = value;
            editor.commands.setContent(markdownToDoc(value), { emitUpdate: false });
        }
    }, [editor, value]);

    const active = useEditorState({
        editor,
        selector: ({ editor: current }) =>
            current
                ? {
                      bold: current.isActive('bold'),
                      italic: current.isActive('italic'),
                      strike: current.isActive('strike'),
                      sup: current.isActive('superscript'),
                      sub: current.isActive('subscript'),
                      code: current.isActive('code'),
                      spoiler: current.isActive('spoiler'),
                      link: current.isActive('link'),
                      heading: current.isActive('heading'),
                      bullets: current.isActive('bulletList'),
                      numbers: current.isActive('orderedList'),
                      quote: current.isActive('blockquote'),
                      table: current.isActive('table'),
                  }
                : null,
    });

    function apply(tool: Tool) {
        if (!editor) return;
        const chain = editor.chain().focus();
        if (tool.id === 'bold') chain.toggleBold().run();
        else if (tool.id === 'italic') chain.toggleItalic().run();
        else if (tool.id === 'strike') chain.toggleStrike().run();
        else if (tool.id === 'sup') chain.toggleSuperscript().run();
        else if (tool.id === 'sub') chain.toggleSubscript().run();
        else if (tool.id === 'code') chain.toggleCode().run();
        else if (tool.id === 'spoiler') chain.toggleMark('spoiler').run();
        else if (tool.id === 'heading') chain.toggleHeading({ level: 2 }).run();
        else if (tool.id === 'bullets') chain.toggleBulletList().run();
        else if (tool.id === 'numbers') chain.toggleOrderedList().run();
        else if (tool.id === 'quote') chain.toggleBlockquote().run();
        else if (tool.id === 'link') openLink(editor);
        else if (tool.id === 'table') chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }

    function saveLink({ text, url }: { text: string; url: string }) {
        if (!editor || !linkDraft) return;
        setLinkDraft(null);
        const chain = editor.chain().focus();
        if (linkDraft.showText) {
            chain.insertContent({ type: 'text', text: text || url, marks: [{ type: 'link', attrs: { href: url } }] }).run();
        } else {
            chain.extendMarkRange('link').setLink({ href: url }).run();
        }
    }

    const tableTools: { label: string; icon?: typeof Rows3; text?: string; run: (current: Editor) => void; danger?: boolean }[] = [
        { label: 'Add a row', icon: Rows3, text: '+', run: (current) => current.chain().focus().addRowAfter().run() },
        { label: 'Remove this row', icon: Rows3, text: '−', run: (current) => current.chain().focus().deleteRow().run() },
        { label: 'Add a column', icon: Columns3, text: '+', run: (current) => current.chain().focus().addColumnAfter().run() },
        { label: 'Remove this column', icon: Columns3, text: '−', run: (current) => current.chain().focus().deleteColumn().run() },
        { label: 'Align column left', icon: AlignLeft, run: (current) => setColumnAlign(current, null) },
        { label: 'Align column centre', icon: AlignCenter, run: (current) => setColumnAlign(current, 'center') },
        { label: 'Align column right', icon: AlignRight, run: (current) => setColumnAlign(current, 'right') },
        { label: 'Delete table', icon: Trash2, run: (current) => current.chain().focus().deleteTable().run(), danger: true },
    ];

    return (
        <>
            <div className="flex items-center gap-1 border-b border-border px-1.5 py-1">
                <ToolGroups groups={TOOLS} onApply={apply} isActive={(tool) => Boolean(active?.[tool.id as keyof typeof active])} />
                {menu}
            </div>
            {active?.table && editor && (
                <div role="toolbar" aria-label="Table" className="flex items-center gap-0.5 overflow-x-auto border-b border-border px-1.5 py-1 [scrollbar-width:none]">
                    {tableTools.map(({ label: toolLabel, icon: Icon, text, run, danger }) => (
                        <ToolbarButton key={toolLabel} label={toolLabel} onClick={() => run(editor)} className={danger ? 'ml-auto hover:text-danger' : undefined}>
                            {Icon && <Icon className="size-4" />}
                            {text && <span className="-ml-0.5 text-xs font-bold">{text}</span>}
                        </ToolbarButton>
                    ))}
                </div>
            )}
            {linkDraft && (
                <LinkPopover
                    draft={linkDraft}
                    onCancel={() => {
                        setLinkDraft(null);
                        editor?.commands.focus();
                    }}
                    onSave={saveLink}
                />
            )}
            <EditorContent editor={editor} className="rich-editor" />
        </>
    );
}
