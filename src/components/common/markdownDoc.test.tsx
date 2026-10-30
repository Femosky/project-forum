import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Markdown from './Markdown';
import { docToMarkdown, markdownToDoc } from './markdownDoc';

const html = (text: string) => renderToStaticMarkup(<Markdown text={text} />);
// Through the editor's document and back: the same Markdown, or at least exactly the same page
const roundTrip = (text: string) => docToMarkdown(markdownToDoc(text));

const SAME = [
    'Plain text.',
    'Two lines\nin a paragraph\n\nand another paragraph',
    '**bold**, *italic*, ~~strike~~ and `code`',
    '**bold with _italic_ inside**',
    '[a link](https://example.com/a_b) and https://example.com/snake_case_url',
    '[**bold link**](https://example.com)',
    'E = mc^(2) and H~(2)O',
    'A >!hidden spoiler!< here',
    '# Big\n\n## Heading\n\n### Smaller',
    '- one\n- two\n- **three**',
    '1. one\n2. two',
    '4. starts at four\n5. next',
    '> quoted\n> lines\n\nafter',
    '> # heading in a quote\n>\n> - list in a quote',
    '```\nconst a = 1;\n\n  indented *not bold*\n```',
    '---',
    '| Area | Rent |\n| --- | --- |\n| Yaba | 1,200,000 |\n| Lekki | 3,500,000 |',
    '| Left | Mid | Right |\n| --- | :---: | ---: |\n| a | **b** | [c](https://example.com) |',
    '| a \\| b | c |\n| --- | --- |\n|  | d |',
];

const SAME_PAGE = [
    '__bold__ and _italic_',
    '^word and ^(a phrase)',
    '* star list\n+ plus',
    'text\n- list right after\n\n\n\nmore',
    '| only | head |\n| --- | --- |',
    'snake_case stays, 2 * 3 * 4 = 24, a\\*b',
    'price ~ 5 and ^ alone',
    '\\# not a heading',
    '\\- not a list',
    '\\> not a quote',
    '[not a link](ftp://x)',
    '***both***',
];

describe('Markdown through the editor', () => {
    it.each(SAME)('keeps %j', (text) => {
        expect(roundTrip(text)).toBe(text);
    });

    it.each(SAME_PAGE)('renders %j the same', (text) => {
        expect(html(roundTrip(text))).toBe(html(text));
    });

    it('settles after one pass', () => {
        for (const text of [...SAME, ...SAME_PAGE]) expect(roundTrip(roundTrip(text))).toBe(roundTrip(text));
    });

    it('escapes typed symbols so they stay text', () => {
        const typed = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '*not italic* and [x](https://a.b) and # hi' }] }] };
        const page = html(docToMarkdown(typed));
        expect(page).toContain('*not italic* and [x](');
        expect(page).not.toContain('<em>');
    });

    it('wraps neighbouring text in one mark, spaces outside', () => {
        const bold = { type: 'bold' };
        const doc = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'a ', marks: [bold] },
                        { type: 'text', text: 'b', marks: [bold, { type: 'italic' }] },
                        { type: 'text', text: ' c ', marks: [bold] },
                        { type: 'text', text: 'd' },
                    ],
                },
            ],
        };
        expect(docToMarkdown(doc)).toBe('**a _b_ c** d');
    });
});
