// A stand-in for the /v1 API with one realistic thread, so CI can build and measure real pages (performance
// budget, Lighthouse) without a database. Guest reads only.
//
//   node scripts/mock-api.mjs [port]     (default 3001)
import { createServer } from 'node:http';

const PORT = Number(process.argv[2] ?? 3001);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
const NOW = Date.parse('2026-10-20T09:00:00Z');
const iso = (minutesAgo) => new Date(NOW - minutesAgo * 60_000).toISOString();

const community = {
    id: '00000000-0000-7000-8000-000000000001',
    name: 'budget',
    display_name: 'Budget and money',
    description: 'Groceries, rent, transport and making a salary stretch.',
    image_url: null,
    rules: [
        { title: 'Stay on topic', description: 'Prices, budgeting and saving. Investment pitches go elsewhere.' },
        { title: 'No referral links', description: '' },
        { title: 'Be kind to beginners', description: 'Everyone starts somewhere.' },
    ],
    category: 'money',
    visibility: 'public',
    status: 'active',
    is_nsfw: false,
    member_count: 18_400,
    post_count: 2_310,
    created_at: iso(500_000),
};
const communityRef = { id: community.id, name: community.name, display_name: community.display_name, image_url: null };
const author = (n) => ({ username: n === 0 ? 'budget_user' : `reader_${n}`, display_name: null, avatar_id: `default_${(n % 6) + 1}` });

const SENTENCES = [
    'Prices have gone up a lot since last year, especially rice, oil and anything imported.',
    'I buy in bulk at the start of the month and only top up fresh food every week.',
    'Transport to the market is part of the cost, so I go with a neighbour and split it.',
    'The open market is still cheaper than the supermarket for most things if you can haggle.',
    'Keeping a simple list on my phone stopped the random spending more than anything else.',
];
const paragraph = (seed, count) => Array.from({ length: count }, (_, i) => SENTENCES[(seed + i) % SENTENCES.length]).join(' ');

function makePost(n, title) {
    return {
        id: `00000000-0000-7000-8000-${String(100 + n).padStart(12, '0')}`,
        short_id: `bdgt${String(n).padStart(4, '0')}`,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        type: 'text',
        title,
        body: `${paragraph(n, 3)}\n\n**What I spend in a month:**\n\n- Food staples: about half\n- Fresh food: a quarter\n- Toiletries and cleaning: the rest\n\n${paragraph(n + 2, 4)}`,
        url: null,
        link_preview: null,
        ai_summary: null,
        is_anonymous: false,
        is_nsfw: false,
        is_sponsored: false,
        status: 'active',
        flair: { id: '00000000-0000-7000-8000-000000000009', name: 'Discussion', color: '#0a7a5c' },
        created_at: iso(60 * (n + 1)),
        edited_at: null,
        pinned_at: null,
        upvote_count: 240 - n * 7,
        downvote_count: 3,
        score: 237 - n * 7,
        comment_count: 84,
        is_indexable: true,
        community: communityRef,
        author: author(0),
        viewer: null,
    };
}

const TITLES = [
    'What does a month of groceries cost you?',
    'Cheapest way to get to work across the city',
    'Is it worth buying a generator or saving for solar?',
    'How do you split bills with flatmates fairly?',
    'Best savings apps that actually pay interest',
    'Rent went up again: how did you negotiate?',
    'Cooking gas or electric: which is cheaper now?',
    'What do you budget for school fees each term?',
    'Small side hustles that covered a real bill',
    'How much do you keep aside for emergencies?',
];
const posts = TITLES.map((title, i) => makePost(i + 1, title));
const thread = posts[0];

let commentId = 0;
function makeComment(depth, parentId, n) {
    commentId += 1;
    const id = `00000000-0000-7000-9000-${String(commentId).padStart(12, '0')}`;
    const replies = depth < 2 ? [0, 1].map((r) => makeComment(depth + 1, id, n * 10 + r)) : [];
    return {
        id,
        short_id: `cmt${String(commentId).padStart(5, '0')}`,
        post_id: thread.id,
        parent_id: parentId,
        depth,
        body: `${depth === 0 ? `Budget comment ${n}: ` : ''}${paragraph(n, depth === 0 ? 3 : 1)}`,
        is_anonymous: false,
        is_sponsored: false,
        status: 'active',
        created_at: iso(50 - depth),
        edited_at: null,
        pinned_at: null,
        upvote_count: 40 - depth * 10,
        downvote_count: 1,
        score: 39 - depth * 10,
        reply_count: replies.length,
        author: author(n % 9 + 1),
        viewer: null,
        replies,
        more_replies: 0,
    };
}
// 20 top-level comments, two levels of replies: a busy thread's first page
const comments = Array.from({ length: 20 }, (_, i) => makeComment(0, null, i + 1));

const light = (post) => ({ short_id: post.short_id, slug: post.slug, title: post.title, community: community.name, score: post.score, comment_count: post.comment_count });

const user = { username: 'budget_user', display_name: null, avatar_id: 'default_1', karma: 5120, is_suspended: false, created_at: iso(400_000) };

const routes = [
    [/^\/v1\/feed$/, () => ({ posts, next_cursor: 'next', scope: 'all' })],
    [/^\/v1\/posts\/([^/]+)$/, ([id]) => findPost(id) && { post: findPost(id) }],
    [/^\/v1\/posts\/([^/]+)\/comments$/, ([id]) => findPost(id) && { comments: id === thread.short_id || id === thread.id ? comments : [], next_cursor: 'next' }],
    [/^\/v1\/posts\/([^/]+)\/related$/, ([id]) => findPost(id) && { related: posts.slice(5, 10).map(light), more_from_community: posts.slice(1, 5).map(light) }],
    [/^\/v1\/communities$/, () => ({ communities: [community], next_cursor: null })],
    [/^\/v1\/communities\/categories$/, () => ({ categories: [{ id: 'money', label: 'Money & Banking', count: 1 }] })],
    [/^\/v1\/communities\/budget$/, () => ({ community, moderators: [{ ...author(0), role: 'owner' }], viewer: null })],
    [/^\/v1\/communities\/budget\/posts$/, () => ({ posts, next_cursor: 'next' })],
    [/^\/v1\/users\/budget_user$/, () => ({ user })],
    [/^\/v1\/users\/budget_user\/posts$/, () => ({ posts, next_cursor: null })],
    [/^\/v1\/users\/budget_user\/comments$/, () => ({ comments: [], next_cursor: null })],
    [/^\/v1\/seo\/status$/, (_, query) => seoStatus(query)],
    [/^\/v1\/seo\/sitemap$/, () => ({ posts: [{ page: 1, lastmod: iso(0) }], communities: [{ page: 1, lastmod: iso(0) }], users: [] })],
];

function findPost(id) {
    return posts.find((post) => post.short_id === id || post.id === id);
}

function seoStatus(query) {
    const id = query.get('id');
    if (query.get('type') === 'post') {
        const post = findPost(id);
        return post ? { state: 'live', path: `/c/${community.name}/${post.short_id}/${post.slug}` } : { state: 'missing' };
    }
    if (query.get('type') === 'community') return id === 'budget' ? { state: 'live', path: '/c/budget' } : { state: 'missing' };
    return id === 'budget_user' ? { state: 'live', path: '/u/budget_user' } : { state: 'missing' };
}

createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    response.setHeader('Access-Control-Allow-Origin', WEB_ORIGIN);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Content-Type', 'application/json');

    for (const [pattern, handler] of routes) {
        const match = pattern.exec(url.pathname);
        if (!match) continue;
        const body = handler(match.slice(1), url.searchParams);
        if (body) return response.end(JSON.stringify(body));
        break;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: { code: 'not_found', message: 'Not found' } }));
}).listen(PORT, () => console.log(`Mock API on http://localhost:${PORT}`));
