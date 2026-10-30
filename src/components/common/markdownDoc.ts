import { BULLET, FENCE, HEADING, INLINE, NUMBERED, QUOTE, RULE, TABLE_ROW, TABLE_RULE, tableCells } from './Markdown';

// Between the site's Markdown (what's stored, see Markdown.tsx for the syntax) and the rich editor's document. Posts
// stay Markdown, so what's published and how it renders never depends on the editor. Loaded with the editor.

type Mark = { type: string; attrs?: Record<string, unknown> };
export type DocNode = { type: string; attrs?: Record<string, unknown>; content?: DocNode[]; text?: string; marks?: Mark[] };

const text = (value: string, marks: Mark[]): DocNode[] => (value ? [{ type: 'text', text: value, ...(marks.length ? { marks } : {}) }] : []);

function inlineNodes(source: string, marks: Mark[] = []): DocNode[] {
    const nodes: DocNode[] = [];
    let last = 0;
    const pattern = new RegExp(INLINE.source, 'g');
    for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
        nodes.push(...text(source.slice(last, match.index), marks));
        const [, , code, linkText, linkUrl, bold, boldAlt, strike, italic, italicAlt, bareUrl, escaped, spoiler, supPhrase, supWord, sub] = match;
        const inner = (value: string, type: string, attrs?: Mark['attrs']) => nodes.push(...inlineNodes(value, [...marks, { type, ...(attrs ? { attrs } : {}) }]));

        if (code !== undefined) nodes.push(...text(code, [{ type: 'code' }]));
        else if (linkText !== undefined) inner(linkText, 'link', { href: linkUrl });
        else if (bold !== undefined || boldAlt !== undefined) inner(bold ?? boldAlt, 'bold');
        else if (strike !== undefined) inner(strike, 'strike');
        else if (italic !== undefined || italicAlt !== undefined) inner(italic ?? italicAlt, 'italic');
        else if (bareUrl !== undefined) nodes.push(...text(bareUrl, [...marks, { type: 'link', attrs: { href: bareUrl } }]));
        else if (escaped !== undefined) nodes.push(...text(escaped, marks));
        else if (spoiler !== undefined) inner(spoiler, 'spoiler');
        else if (supPhrase !== undefined || supWord !== undefined) inner(supPhrase ?? supWord, 'superscript');
        else if (sub !== undefined) inner(sub, 'subscript');

        last = match.index + match[0].length;
    }
    nodes.push(...text(source.slice(last), marks));
    return nodes;
}

const paragraph = (content: DocNode[]): DocNode => ({ type: 'paragraph', ...(content.length ? { content } : {}) });

function tableNode(header: string[], align: (string | null)[], rows: string[][]): DocNode {
    const cell = (type: string, value: string, column: number): DocNode => ({ type, attrs: { align: align[column] ?? null }, content: [paragraph(inlineNodes(value))] });
    return {
        type: 'table',
        content: [
            { type: 'tableRow', content: header.map((value, c) => cell('tableHeader', value, c)) },
            ...rows.map((row) => ({ type: 'tableRow', content: header.map((_, c) => cell('tableCell', row[c] ?? '', c)) })),
        ],
    };
}

function blockNodes(source: string): DocNode[] {
    const lines = source.replace(/\r\n?/g, '\n').split('\n');
    const blocks: DocNode[] = [];
    const isTableStart = (at: number) => TABLE_ROW.test(lines[at]) && at + 1 < lines.length && TABLE_RULE.test(lines[at + 1]);
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        if (line.trim() === '') {
            i++;
        } else if (FENCE.test(line)) {
            const code: string[] = [];
            i++;
            while (i < lines.length && !FENCE.test(lines[i])) code.push(lines[i++]);
            i++;
            const value = code.join('\n');
            blocks.push({ type: 'codeBlock', ...(value ? { content: [{ type: 'text', text: value }] } : {}) });
        } else if (HEADING.test(line)) {
            const [, hashes, value] = line.match(HEADING)!;
            blocks.push({ type: 'heading', attrs: { level: hashes.length }, content: inlineNodes(value) });
            i++;
        } else if (isTableStart(i)) {
            const header = tableCells(line);
            const align = tableCells(lines[i + 1]).map((rule) => (rule.startsWith(':') && rule.endsWith(':') ? 'center' : rule.endsWith(':') ? 'right' : null));
            i += 2;
            const rows: string[][] = [];
            while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(tableCells(lines[i++]));
            blocks.push(tableNode(header, align, rows));
        } else if (RULE.test(line)) {
            blocks.push({ type: 'horizontalRule' });
            i++;
        } else if (QUOTE.test(line)) {
            const quoted: string[] = [];
            while (i < lines.length && QUOTE.test(lines[i])) quoted.push(lines[i++].match(QUOTE)![1]);
            const content = blockNodes(quoted.join('\n'));
            blocks.push({ type: 'blockquote', content: content.length ? content : [paragraph([])] });
        } else if (BULLET.test(line) || NUMBERED.test(line)) {
            const ordered = NUMBERED.test(line);
            const pattern = ordered ? NUMBERED : BULLET;
            const items: DocNode[] = [];
            const start = ordered ? Number(line.match(NUMBERED)![1]) : 1;
            while (i < lines.length && pattern.test(lines[i])) {
                const match = lines[i++].match(pattern)!;
                items.push({ type: 'listItem', content: [paragraph(inlineNodes(ordered ? match[2] : match[1]))] });
            }
            blocks.push({ type: ordered ? 'orderedList' : 'bulletList', ...(ordered ? { attrs: { start } } : {}), content: items });
        } else {
            const content: DocNode[] = [];
            let first = true;
            while (
                i < lines.length &&
                lines[i].trim() !== '' &&
                !FENCE.test(lines[i]) &&
                !HEADING.test(lines[i]) &&
                !QUOTE.test(lines[i]) &&
                !BULLET.test(lines[i]) &&
                !NUMBERED.test(lines[i]) &&
                !RULE.test(lines[i]) &&
                !isTableStart(i)
            ) {
                if (!first) content.push({ type: 'hardBreak' });
                content.push(...inlineNodes(lines[i++]));
                first = false;
            }
            blocks.push(paragraph(content));
        }
    }
    return blocks;
}

export function markdownToDoc(source: string): DocNode {
    const content = blockNodes(source);
    return { type: 'doc', content: content.length ? content : [paragraph([])] };
}

// Text is escaped only where it would otherwise turn into formatting, and URLs are left alone
function escapeText(value: string): string {
    return value
        .split(/(https?:\/\/\S+)/)
        .map((part, index) =>
            index % 2
                ? part
                : part
                      .replace(/\\(?=[\\`*_~^[\]()#>!|-])/g, '\\\\')
                      .replace(/[`*^]/g, '\\$&')
                      .replace(/(?<![\w])_(?!\s)/g, '\\_')
                      .replace(/~(?=[~(])/g, '\\~')
                      .replace(/>!/g, '\\>!')
        )
        .join('')
        .replace(/\[(?=[^\]\n]*\]\(https?:)/g, '\\[');
}

// Outermost first. Each run of neighbouring text sharing a mark is wrapped once, so "**a *b* c**" stays one bold span
const MARK_ORDER = ['link', 'spoiler', 'superscript', 'subscript', 'bold', 'italic', 'strike', 'code'];

function wrap(type: string, inner: string, insideBold: boolean, attrs?: Mark['attrs']) {
    // Spaces stay outside the markers ("* a*" isn't italic)
    const [, before, body, after] = inner.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    if (!body) return inner;
    const open = (start: string, end: string) => `${before}${start}${body}${end}${after}`;
    if (type === 'link') {
        const href = String(attrs?.href ?? '');
        if (!/^https?:\/\//i.test(href)) return inner;
        return body === href ? inner : open('[', `](${href})`);
    }
    if (type === 'spoiler') return open('>!', '!<');
    if (type === 'superscript') return open('^(', ')');
    if (type === 'subscript') return open('~(', ')');
    if (type === 'bold') return open('**', '**');
    // "***a***" would close the bold early, so italics inside bold use underscores
    if (type === 'italic') return insideBold ? open('_', '_') : open('*', '*');
    if (type === 'strike') return open('~~', '~~');
    return inner;
}

function inlineMarkdown(nodes: DocNode[], insideBold = false): string {
    let out = '';
    for (let i = 0; i < nodes.length; ) {
        const node = nodes[i];
        if (node.type === 'hardBreak') {
            out += '\n';
            i++;
            continue;
        }
        const marks = (node.marks ?? []).slice().sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type));
        const mark = marks.find((candidate) => candidate.type !== 'code');
        if (!mark) {
            const value = node.text ?? '';
            out += marks.length ? `\`${value}\`` : escapeText(value);
            i++;
            continue;
        }
        const sameMark = (other: DocNode) =>
            other.marks?.some((candidate) => candidate.type === mark.type && JSON.stringify(candidate.attrs) === JSON.stringify(mark.attrs));
        const run: DocNode[] = [];
        while (i < nodes.length && sameMark(nodes[i])) {
            const { marks: own, ...rest } = nodes[i++];
            run.push({ ...rest, marks: own?.filter((candidate) => candidate.type !== mark.type) });
        }
        out += wrap(mark.type, inlineMarkdown(run, insideBold || mark.type === 'bold'), insideBold, mark.attrs);
    }
    return out;
}

// A paragraph that starts like a heading, quote, list or rule, but was typed as plain text
const lineSafe = (value: string) => value.replace(/^(\s*)(#{1,6}\s|>|-\s|-{3,}$)/gm, '$1\\$2');

function tableMarkdown(table: DocNode): string {
    const rows = table.content ?? [];
    const cell = (node: DocNode) =>
        inlineMarkdown(node.content?.flatMap((block) => block.content ?? []) ?? [])
            .replace(/\n/g, ' ')
            .replace(/\|/g, '\\|');
    const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
    const rule = (rows[0]?.content ?? []).map((head) => {
        const align = head.attrs?.align;
        return align === 'center' ? ':---:' : align === 'right' ? '---:' : '---';
    });
    return [line((rows[0]?.content ?? []).map(cell)), line(rule), ...rows.slice(1).map((row) => line((row.content ?? []).map(cell)))].join('\n');
}

function blockMarkdown(node: DocNode): string {
    const children = node.content ?? [];
    switch (node.type) {
        case 'paragraph':
            return lineSafe(inlineMarkdown(children));
        case 'heading':
            return `${'#'.repeat(Number(node.attrs?.level ?? 2))} ${inlineMarkdown(children)}`;
        case 'blockquote':
            return blocksMarkdown(children)
                .split('\n')
                .map((line) => `> ${line}`.trimEnd())
                .join('\n');
        case 'bulletList':
            return children.map((item) => `- ${blocksMarkdown(item.content ?? []).replace(/\n+/g, ' ')}`).join('\n');
        case 'orderedList': {
            const start = Number(node.attrs?.start ?? 1);
            return children.map((item, index) => `${start + index}. ${blocksMarkdown(item.content ?? []).replace(/\n+/g, ' ')}`).join('\n');
        }
        case 'codeBlock':
            return `\`\`\`\n${children.map((child) => child.text ?? '').join('')}\n\`\`\``;
        case 'horizontalRule':
            return '---';
        case 'table':
            return tableMarkdown(node);
        default:
            return '';
    }
}

function blocksMarkdown(nodes: DocNode[]): string {
    return nodes.map(blockMarkdown).filter(Boolean).join('\n\n');
}

export const docToMarkdown = (doc: DocNode) => blocksMarkdown(doc.content ?? []);
