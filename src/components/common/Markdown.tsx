import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

// A small, safe Markdown subset for posts and comments, close to what Reddit supports: paragraphs, # headings,
// **bold**, *italic*, ~~strike~~, ^superscript or ^(a phrase), ~(subscript), >!spoilers!<, `code`, fenced code
// blocks, > quotes, bulleted and numbered lists, | tables |, rules, [links](https://...) and bare URLs. It builds
// React elements directly (never HTML strings), so user text can't inject markup, and it ships no dependency.

const INLINE =
    /(`+)([^`]+?)\1|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|\*(?!\s)([^*\n]+?)\*|(?<![\w])_(?!\s)([^_\n]+?)_(?![\w])|(https?:\/\/[^\s<]*[^\s<.,:;"')\]!?])|\\([\\`*_~^[\]()#>!|-])|>!(.+?)!<|\^\(([^)\n]+)\)|\^([^\s^()]+)|~\(([^)\n]+)\)/g;

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a href={href} target="_blank" rel="nofollow ugc noopener noreferrer" className="relative z-10 text-link underline underline-offset-2">
            {children}
        </a>
    );
}

function renderInline(text: string, keyPrefix = 'i'): ReactNode[] {
    const nodes: ReactNode[] = [];
    let last = 0;
    let index = 0;
    const pattern = new RegExp(INLINE.source, 'g');

    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
        if (match.index > last) nodes.push(text.slice(last, match.index));
        const key = `${keyPrefix}-${index++}`;
        const [, , code, linkText, linkUrl, bold, boldAlt, strike, italic, italicAlt, bareUrl, escaped, spoiler, supPhrase, supWord, sub] =
            match;

        if (code !== undefined) nodes.push(<code key={key}>{code}</code>);
        else if (linkText !== undefined) nodes.push(<ExternalLink key={key} href={linkUrl}>{renderInline(linkText, key)}</ExternalLink>);
        else if (bold !== undefined || boldAlt !== undefined) nodes.push(<strong key={key}>{renderInline(bold ?? boldAlt, key)}</strong>);
        else if (strike !== undefined) nodes.push(<del key={key}>{renderInline(strike, key)}</del>);
        else if (italic !== undefined || italicAlt !== undefined) nodes.push(<em key={key}>{renderInline(italic ?? italicAlt, key)}</em>);
        else if (bareUrl !== undefined) nodes.push(<ExternalLink key={key} href={bareUrl}>{bareUrl}</ExternalLink>);
        else if (escaped !== undefined) nodes.push(escaped);
        else if (spoiler !== undefined)
            // Hidden until tapped or focused (CSS only, see .spoiler in globals.css)
            nodes.push(
                <span key={key} className="spoiler" tabIndex={0} role="button" aria-label="Spoiler, select to reveal">
                    {renderInline(spoiler, key)}
                </span>
            );
        else if (supPhrase !== undefined || supWord !== undefined) nodes.push(<sup key={key}>{renderInline(supPhrase ?? supWord, key)}</sup>);
        else if (sub !== undefined) nodes.push(<sub key={key}>{renderInline(sub, key)}</sub>);

        last = match.index + match[0].length;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
}

// Lines of a paragraph keep their line breaks, as people expect from a chat-style box
function renderLines(lines: string[], key: string): ReactNode[] {
    return lines.flatMap((line, i) => (i === 0 ? renderInline(line, `${key}-${i}`) : [<br key={`${key}-br${i}`} />, ...renderInline(line, `${key}-${i}`)]));
}

const FENCE = /^\s*```/;
const HEADING = /^(#{1,6})\s+(.*)$/;
// A line starting with >! is a spoiler, not a quote
const QUOTE = /^\s*>(?!!)\s?(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
// Tables: a | header | row, a | --- | :---: | row that sets alignment, then | body | rows
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/;

// Cells of a "| a | b |" row; "\|" is a pipe inside a cell (the table editor writes it that way)
function tableCells(line: string): string[] {
    return line
        .trim()
        .replace(/^\|/, '')
        .replace(/(?<!\\)\|$/, '')
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

function renderBlocks(source: string, keyPrefix = 'b'): ReactNode[] {
    const lines = source.replace(/\r\n?/g, '\n').split('\n');
    const blocks: ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const key = `${keyPrefix}-${blocks.length}`;

        if (line.trim() === '') {
            i++;
        } else if (FENCE.test(line)) {
            const code: string[] = [];
            i++;
            while (i < lines.length && !FENCE.test(lines[i])) code.push(lines[i++]);
            i++; // closing fence (or end of text)
            blocks.push(
                <pre key={key}>
                    <code>{code.join('\n')}</code>
                </pre>
            );
        } else if (HEADING.test(line)) {
            const [, hashes, text] = line.match(HEADING)!;
            const Tag = hashes.length <= 2 ? 'h3' : 'h4';
            blocks.push(<Tag key={key}>{renderInline(text, key)}</Tag>);
            i++;
        } else if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1])) {
            const header = tableCells(line);
            const align = tableCells(lines[i + 1]).map((rule) =>
                rule.startsWith(':') && rule.endsWith(':') ? 'center' : rule.endsWith(':') ? 'right' : undefined
            );
            i += 2;
            const rows: string[][] = [];
            while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(tableCells(lines[i++]));
            blocks.push(
                <div key={key} className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                {header.map((cell, c) => (
                                    <th key={c} style={{ textAlign: align[c] }}>
                                        {renderInline(cell, `${key}-h${c}`)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, r) => (
                                <tr key={r}>
                                    {header.map((_, c) => (
                                        <td key={c} style={{ textAlign: align[c] }}>
                                            {renderInline(row[c] ?? '', `${key}-${r}-${c}`)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        } else if (RULE.test(line)) {
            blocks.push(<hr key={key} />);
            i++;
        } else if (QUOTE.test(line)) {
            const quoted: string[] = [];
            while (i < lines.length && QUOTE.test(lines[i])) quoted.push(lines[i++].match(QUOTE)![1]);
            blocks.push(<blockquote key={key}>{renderBlocks(quoted.join('\n'), key)}</blockquote>);
        } else if (BULLET.test(line) || NUMBERED.test(line)) {
            const ordered = NUMBERED.test(line);
            const itemPattern = ordered ? NUMBERED : BULLET;
            const items: string[] = [];
            while (i < lines.length && itemPattern.test(lines[i])) {
                const match = lines[i++].match(itemPattern)!;
                items.push(ordered ? match[2] : match[1]);
            }
            const children = items.map((item, n) => <li key={`${key}-${n}`}>{renderInline(item, `${key}-${n}`)}</li>);
            const start = ordered ? Number(line.match(NUMBERED)![1]) : undefined;
            blocks.push(ordered ? <ol key={key} start={start !== 1 ? start : undefined}>{children}</ol> : <ul key={key}>{children}</ul>);
        } else {
            const paragraph: string[] = [];
            while (
                i < lines.length &&
                lines[i].trim() !== '' &&
                !FENCE.test(lines[i]) &&
                !HEADING.test(lines[i]) &&
                !QUOTE.test(lines[i]) &&
                !BULLET.test(lines[i]) &&
                !NUMBERED.test(lines[i]) &&
                !RULE.test(lines[i]) &&
                !(TABLE_ROW.test(lines[i]) && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1]))
            ) {
                paragraph.push(lines[i++]);
            }
            blocks.push(<p key={key}>{renderLines(paragraph, key)}</p>);
        }
    }
    return blocks;
}

export function Markdown({ text, className }: { text: string; className?: string }) {
    return <div className={twMerge('markdown break-words', className)}>{renderBlocks(text)}</div>;
}

// Plain text for previews and meta descriptions: drops the Markdown symbols
export function stripMarkdown(text: string): string {
    return text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^\s*(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
        .replace(/>!(.+?)!</g, '[spoiler]')
        .replace(/\^\(([^)]+)\)|~\(([^)]+)\)/g, '$1$2')
        .replace(/^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*$/gm, ' ')
        .replace(/\|/g, ' ')
        .replace(/(\*\*|__|~~|`|\*|_|\^)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export default Markdown;
