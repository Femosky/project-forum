'use client';

import { ClipboardEvent, KeyboardEvent, useRef, useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, Minus, Plus, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';

// A table, edited as a grid instead of as Markdown pipes. The editor's Table button opens it: first a size picker,
// or straight to the cells of the table the cursor is in. It writes a plain Markdown table back (Markdown.tsx renders
// it), so typing one by hand still works. Loaded only when opened (MarkdownEditor), so pages don't carry it.

export type Align = 'left' | 'center' | 'right' | null;
export type Table = { cells: string[][]; align: Align[] };

const MAX_COLUMNS = 8;
const MAX_ROWS = 30;
const PICKER = 6;
const SEPARATOR = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

// Cells of a "| a | b |" line; "\|" is a pipe inside a cell
export function cellsOf(line: string): string[] {
    return line
        .trim()
        .replace(/^\|/, '')
        .replace(/(?<!\\)\|$/, '')
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

const alignOf = (rule: string): Align => {
    const left = rule.startsWith(':');
    const right = rule.endsWith(':');
    return left && right ? 'center' : right ? 'right' : left ? 'left' : null;
};

// The table around a position in the text (its first and last character, and its contents), or null
export function tableAt(text: string, position: number): { start: number; end: number; table: Table } | null {
    const lines = text.split('\n');
    const starts: number[] = [];
    let offset = 0;
    for (const line of lines) {
        starts.push(offset);
        offset += line.length + 1;
    }
    const at = lines.findIndex((line, index) => position >= starts[index] && position <= starts[index] + line.length);
    if (at < 0 || !lines[at].includes('|')) return null;
    let first = at;
    while (first > 0 && lines[first - 1].includes('|')) first--;
    let last = at;
    while (last < lines.length - 1 && lines[last + 1].includes('|')) last++;
    if (last - first < 1 || !SEPARATOR.test(lines[first + 1])) return null;

    const rows = [lines[first], ...lines.slice(first + 2, last + 1)].map(cellsOf).slice(0, MAX_ROWS + 1);
    const width = Math.min(Math.max(...rows.map((row) => row.length)), MAX_COLUMNS);
    const rules = cellsOf(lines[first + 1]);
    return {
        start: starts[first],
        end: starts[last] + lines[last].length,
        table: {
            cells: rows.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? '')),
            align: Array.from({ length: width }, (_, index) => alignOf(rules[index] ?? '')),
        },
    };
}

export function toMarkdown({ cells, align }: Table): string {
    const cell = (value: string) => value.replace(/\n/g, ' ').replace(/\|/g, '\\|').trim() || ' ';
    const line = (row: string[]) => `| ${row.map(cell).join(' | ')} |`;
    const rule = (value: Align) => (value === 'center' ? ':---:' : value === 'right' ? '---:' : value === 'left' ? ':---' : '---');
    return [line(cells[0]), `| ${align.map(rule).join(' | ')} |`, ...cells.slice(1).map(line)].join('\n');
}

const blank = (rows: number, columns: number): Table => ({
    cells: Array.from({ length: rows }, () => Array(columns).fill('')),
    align: Array(columns).fill(null),
});

type TableEditorProps = {
    // An existing table to edit, or null to start with the size picker
    initial: Table | null;
    onDone: (markdown: string) => void;
    onCancel: () => void;
};

export default function TableEditor({ initial, onDone, onCancel }: TableEditorProps) {
    const [table, setTable] = useState<Table | null>(initial);
    const [hover, setHover] = useState<[number, number]>([2, 2]);
    const grid = useRef<HTMLTableElement>(null);

    const focusCell = (row: number, column: number) =>
        requestAnimationFrame(() => grid.current?.querySelector<HTMLInputElement>(`[data-cell="${row}-${column}"]`)?.focus());

    // Size picker: rows include the header row
    if (!table) {
        return (
            <Panel label="Add a table" onCancel={onCancel}>
                <p className="text-xs text-muted">
                    Pick a size: {hover[0]} {hover[0] === 1 ? 'row' : 'rows'} under the header, {hover[1]} {hover[1] === 1 ? 'column' : 'columns'}.
                    You can add more later.
                </p>
                <div role="grid" aria-label="Table size" className="grid w-fit grid-cols-6 gap-1" onMouseLeave={() => setHover([2, 2])}>
                    {Array.from({ length: PICKER * PICKER }, (_, index) => {
                        const rows = Math.floor(index / PICKER) + 1;
                        const columns = (index % PICKER) + 1;
                        const lit = rows <= hover[0] && columns <= hover[1];
                        return (
                            <button
                                key={index}
                                type="button"
                                aria-label={`${rows} by ${columns}`}
                                onMouseEnter={() => setHover([rows, columns])}
                                onFocus={() => setHover([rows, columns])}
                                onClick={() => {
                                    setTable(blank(rows + 1, columns));
                                    focusCell(0, 0);
                                }}
                                className={twMerge(
                                    'size-7 cursor-pointer rounded-[5px] ring-1 ring-inset transition-colors sm:size-6',
                                    lit ? 'bg-accent/80 ring-accent' : 'bg-surface ring-border-strong'
                                )}
                            />
                        );
                    })}
                </div>
            </Panel>
        );
    }

    const columns = table.cells[0].length;
    const update = (next: Table) => setTable(next);
    const setCell = (row: number, column: number, value: string) =>
        update({ ...table, cells: table.cells.map((cells, r) => (r === row ? cells.map((cell, c) => (c === column ? value : cell)) : cells)) });
    const addRow = (after = table.cells.length - 1) =>
        update({ ...table, cells: [...table.cells.slice(0, after + 1), Array(columns).fill(''), ...table.cells.slice(after + 1)] });
    const addColumn = () => update({ cells: table.cells.map((cells) => [...cells, '']), align: [...table.align, null] });
    const removeRow = (row: number) => update({ ...table, cells: table.cells.filter((_, r) => r !== row) });
    const removeColumn = (column: number) =>
        update({ cells: table.cells.map((cells) => cells.filter((_, c) => c !== column)), align: table.align.filter((_, c) => c !== column) });
    const setAlign = (column: number, value: Align) => update({ ...table, align: table.align.map((current, c) => (c === column ? value : current)) });

    // Enter goes to the cell below, adding a row at the bottom; Tab moves across as usual
    function onKeyDown(event: KeyboardEvent<HTMLInputElement>, row: number, column: number) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if (row === table!.cells.length - 1) {
            if (table!.cells.length > MAX_ROWS) return;
            addRow();
        }
        focusCell(row + 1, column);
    }

    // Pasting from a spreadsheet (Excel, Google Sheets, Numbers) brings tab-separated rows: spread them over the cells
    function onPaste(event: ClipboardEvent<HTMLInputElement>, row: number, column: number) {
        const text = event.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n').replace(/\n$/, '');
        if (!text.includes('\t') && !text.includes('\n')) return;
        event.preventDefault();
        const pasted = text.split('\n').map((line) => line.split('\t'));
        const width = Math.min(Math.max(columns, column + Math.max(...pasted.map((line) => line.length))), MAX_COLUMNS);
        const height = Math.min(Math.max(table!.cells.length, row + pasted.length), MAX_ROWS + 1);
        const cells = Array.from({ length: height }, (_, r) =>
            Array.from({ length: width }, (_, c) => pasted[r - row]?.[c - column]?.trim() ?? table!.cells[r]?.[c] ?? '')
        );
        update({ cells, align: Array.from({ length: width }, (_, c) => table!.align[c] ?? null) });
    }

    const isEmpty = table.cells.every((cells) => cells.every((cell) => !cell.trim()));
    const iconButton =
        'flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-subtle hover:bg-hover hover:text-text disabled:pointer-events-none disabled:opacity-30';

    return (
        <Panel label={initial ? 'Edit table' : 'Add a table'} onCancel={onCancel}>
            <p className="text-xs text-muted">The first row is the header. Tab moves across, Enter moves down. You can paste rows from a spreadsheet.</p>
            <div className="-mx-1 overflow-x-auto px-1">
                <table ref={grid} className="border-separate border-spacing-1">
                    <thead>
                        <tr>
                            {table.align.map((value, column) => (
                                <th key={column} className="p-0 font-normal">
                                    <div className="flex items-center gap-0.5">
                                        {(
                                            [
                                                ['left', AlignLeft],
                                                ['center', AlignCenter],
                                                ['right', AlignRight],
                                            ] as const
                                        ).map(([option, Icon]) => (
                                            <button
                                                key={option}
                                                type="button"
                                                aria-label={`Align column ${column + 1} ${option}`}
                                                aria-pressed={value === option}
                                                onClick={() => setAlign(column, value === option ? null : option)}
                                                className={twMerge(iconButton, value === option && 'bg-active text-text')}
                                            >
                                                <Icon className="size-3.5" />
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => removeColumn(column)}
                                            disabled={columns <= 1}
                                            aria-label={`Remove column ${column + 1}`}
                                            className={twMerge(iconButton, 'ml-auto')}
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {table.cells.map((cells, row) => (
                            <tr key={row}>
                                {cells.map((cell, column) => (
                                    <td key={column} className="p-0">
                                        <input
                                            data-cell={`${row}-${column}`}
                                            value={cell}
                                            onChange={(event) => setCell(row, column, event.target.value)}
                                            onKeyDown={(event) => onKeyDown(event, row, column)}
                                            onPaste={(event) => onPaste(event, row, column)}
                                            placeholder={row === 0 ? `Heading ${column + 1}` : ''}
                                            aria-label={row === 0 ? `Heading ${column + 1}` : `Row ${row}, column ${column + 1}`}
                                            className={twMerge(
                                                'h-9 w-full min-w-28 rounded-[6px] border border-border-strong bg-surface px-2 text-sm outline-none focus:border-muted',
                                                row === 0 && 'font-semibold',
                                                table.align[column] === 'center' && 'text-center',
                                                table.align[column] === 'right' && 'text-right'
                                            )}
                                        />
                                    </td>
                                ))}
                                <td className="p-0">
                                    {row > 0 && (
                                        <button type="button" onClick={() => removeRow(row)} disabled={table.cells.length <= 2} aria-label={`Remove row ${row}`} className={iconButton}>
                                            <Minus className="size-3.5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => addRow()} disabled={table.cells.length > MAX_ROWS}>
                    <Plus className="size-4" /> Row
                </Button>
                <Button size="sm" variant="outline" onClick={addColumn} disabled={columns >= MAX_COLUMNS}>
                    <Plus className="size-4" /> Column
                </Button>
                <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={() => onDone(toMarkdown(table))} disabled={isEmpty}>
                        {initial ? 'Update table' : 'Add table'}
                    </Button>
                </div>
            </div>
        </Panel>
    );
}

function Panel({ label, onCancel, children }: { label: string; onCancel: () => void; children: React.ReactNode }) {
    return (
        <div
            role="dialog"
            aria-label={label}
            className="absolute inset-x-2 top-11 z-20 flex max-h-[70vh] flex-col gap-3 overflow-y-auto rounded-[10px] bg-surface-raised p-3 shadow-raised"
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    onCancel();
                }
            }}
        >
            <p className="text-sm font-semibold">{label}</p>
            {children}
        </div>
    );
}
