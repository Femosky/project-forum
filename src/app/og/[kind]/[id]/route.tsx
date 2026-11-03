import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import type { ReactNode } from 'react';
import { renderAvatar } from '@/avatars/parts';
import { communityLabel } from '@/lib/communityName';
import { communityIconSvg } from '@/lib/communityIcon';
import { LOGO_TEXT, REPUTATION_LABEL } from '@/lib/constants';
import { APP_ICON } from '../../logo';
import { publicApi } from '@/lib/api/server';
import { CommunityResponse, PostResponse, PublicUserResponse } from '@/types/api';
import NumberUtility from '@/lib/utils/NumberUtility';

// Share images (1200×630 PNG) for /og/post/{shortId}, /og/c/{name}, /og/u/{username} and /og/site/default.
// "Obsidian": near-black, a frosted glass card and a faint Apple red light behind it. Made on the server only, so
// they cost the pages nothing. Around 60-120 KB each: WhatsApp drops the large preview past ~300 KB.

const SIZE = { width: 1200, height: 630 };
const CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
const SITE_LINE = 'Ask questions, share what you know, get real answers.';

const INK = {
    background: '#0a0a0c',
    // The red light top right, and a little white light bottom left so the glass has something to catch
    light: 'radial-gradient(circle at 96% 0%, rgba(255,59,48,0.22) 0%, rgba(255,59,48,0) 42%), radial-gradient(circle at 0% 100%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 45%)',
    glass: 'linear-gradient(180deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.03) 100%)',
    rim: '#2a2a2f',
    text: '#f5f5f7',
    muted: '#98989f',
    faint: '#636366',
    rule: 'rgba(255,255,255,0.08)',
};

// Hanken Grotesk, as on the site; its latin-ext files cover Yoruba and Igbo letters such as ọ and ẹ. Hanken has no
// naira sign (₦), so Inter's latin-ext files stand in for that and anything else missing.
const FONT_DIR = join(process.cwd(), 'src/app/og/fonts');
const WEIGHTS = [400, 500, 600] as const;
const FILES = [
    { name: 'Hanken Grotesk', file: 'hanken-grotesk-' },
    { name: 'Hanken Grotesk', file: 'hanken-grotesk-ext-' },
    { name: 'Inter', file: 'inter-ext-' },
];
type Font = { name: string; data: Buffer; weight: (typeof WEIGHTS)[number]; style: 'normal' };
let fonts: Promise<Font[]> | undefined;
const loadFonts = () =>
    (fonts ??= Promise.all(
        FILES.flatMap(({ name, file }) =>
            WEIGHTS.map(async (weight): Promise<Font> => ({ name, data: await readFile(join(FONT_DIR, `${file}${weight}.woff`)), weight, style: 'normal' }))
        )
    ));

const svgUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const avatarUrl = (code: string | null | undefined) => {
    const svg = code != null ? renderAvatar(code) : null;
    return svg ? svgUrl(svg) : null;
};
// Drawn community icons are inlined; uploaded ones are fetched by the renderer (https addresses only)
const communityIconUrl = (imageUrl: string | null) => {
    const drawn = imageUrl?.match(/^\/community-icon\/(.+)$/);
    if (drawn) {
        const svg = communityIconSvg(drawn[1]);
        return svg ? svgUrl(svg) : null;
    }
    return imageUrl?.startsWith('https://') ? imageUrl : null;
};

const count = (value: number, one: string, many = `${one}s`) => `${NumberUtility.compactFormatter.format(value)} ${value === 1 ? one : many}`;
// Shortens at a word break where there is one, with an ellipsis
const clip = (text: string, max: number) => {
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    const space = cut.lastIndexOf(' ');
    return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, '')}…`;
};
const joined = (date: string) => `Joined ${new Date(date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`;

type Stat = { icon?: 'up' | 'reply'; label: string };
type Card =
    | { kind: 'post'; community: string; communityIcon: string | null; title: string; author: string | null; avatar: string | null; stats: Stat[] }
    | { kind: 'community'; name: string; icon: string | null; description: string | null; stats: Stat[] }
    | { kind: 'profile'; name: string; handle: string | null; avatar: string | null; stats: Stat[] };

async function cardFor(kind: string, id: string): Promise<Card | null> {
    const key = encodeURIComponent(id);
    if (kind === 'post') {
        const { data } = await publicApi<PostResponse>(`/posts/${key}`, 600);
        const post = data?.post;
        if (!post || post.status === 'removed' || post.status === 'deleted') return null;
        const author = post.is_anonymous ? null : post.author;
        // Mature posts keep their title and author off the preview: it shows wherever the link is pasted
        const mature = post.is_nsfw;
        return {
            kind: 'post',
            community: communityLabel(post.community),
            communityIcon: communityIconUrl(post.community.image_url),
            title: mature ? 'Mature post' : post.title,
            author: mature ? null : author ? (author.display_name ?? author.username) : 'Anonymous',
            avatar: mature ? null : avatarUrl(author ? author.avatar : post.anon_avatar),
            stats: [
                { icon: 'up', label: count(post.score, 'point') },
                { icon: 'reply', label: count(post.comment_count, 'reply', 'replies') },
            ],
        };
    }
    if (kind === 'c') {
        const { data } = await publicApi<CommunityResponse>(`/communities/${key}`);
        const community = data?.community;
        if (!community) return null;
        return {
            kind: 'community',
            name: communityLabel(community),
            icon: communityIconUrl(community.image_url),
            description: community.description,
            stats: [{ label: count(community.member_count, 'member') }, { label: count(community.post_count, 'post') }],
        };
    }
    if (kind === 'u') {
        const { data } = await publicApi<PublicUserResponse>(`/users/${key}`);
        const user = data?.user;
        if (!user || user.is_suspended) return null;
        return {
            kind: 'profile',
            name: user.display_name ?? user.username,
            handle: user.display_name ? `@${user.username}` : null,
            // No avatar code means the one drawn from the username
            avatar: avatarUrl(user.avatar ?? ''),
            stats: [{ label: `${NumberUtility.compactFormatter.format(user.karma)} ${REPUTATION_LABEL}` }, { label: joined(user.created_at) }],
        };
    }
    return null;
}

function Lockup({ size }: { size: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(size * 0.3) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={APP_ICON} width={size} height={size} alt="" style={{ borderRadius: size * 0.225 }} />
            <span style={{ fontSize: size * 0.72, fontWeight: 600, letterSpacing: -0.6, color: INK.text }}>{LOGO_TEXT}</span>
        </div>
    );
}

// A community's icon, or its first letter on glass when it has none
function Tile({ src, label, size, radius }: { src: string | null; label: string; size: number; radius: number }) {
    if (src) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} width={size} height={size} alt="" style={{ borderRadius: radius }} />;
    }
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size,
                height: size,
                borderRadius: radius,
                background: INK.glass,
                border: `1px solid ${INK.rim}`,
                color: INK.text,
                fontSize: size * 0.48,
                fontWeight: 600,
            }}
        >
            {label.slice(0, 1).toUpperCase()}
        </div>
    );
}

function Avatar({ src, size }: { src: string | null; size: number }) {
    // eslint-disable-next-line @next/next/no-img-element
    return src ? <img src={src} width={size} height={size} alt="" style={{ borderRadius: size / 2 }} /> : null;
}

const ICON_LINE = { fill: 'none', stroke: INK.muted, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

// Post stats carry icons; the others are a plain list with dots between
function Stats({ stats }: { stats: Stat[] }) {
    const iconed = stats.some((stat) => stat.icon);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: iconed ? 34 : 16, fontSize: 28, fontWeight: 500, color: INK.muted }}>
            {stats.map((stat, index) => (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: iconed ? 10 : 16 }}>
                    {!iconed && index > 0 && <span style={{ color: INK.faint }}>·</span>}
                    {stat.icon === 'up' && (
                        <svg width={30} height={30} viewBox="0 0 24 24" {...ICON_LINE} strokeWidth={2.4}>
                            <path d="M6 15l6-6 6 6" />
                        </svg>
                    )}
                    {stat.icon === 'reply' && (
                        <svg width={30} height={30} viewBox="0 0 24 24" {...ICON_LINE} strokeWidth={2}>
                            <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z" />
                        </svg>
                    )}
                    <span>{stat.label}</span>
                </div>
            ))}
        </div>
    );
}

// The glass card page images sit on: a header row with the logo, the main block, and a footer under a hairline
function Glass({ header, footer, children }: { header?: ReactNode; footer: ReactNode; children: ReactNode }) {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', padding: 36, background: INK.background, backgroundImage: INK.light, fontFamily: 'Hanken Grotesk' }}>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '52px 60px 48px',
                    borderRadius: 40,
                    background: INK.glass,
                    border: `1px solid ${INK.rim}`,
                    boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: header ? 'space-between' : 'flex-end' }}>
                    {header}
                    <Lockup size={40} />
                </div>
                {children}
                <div style={{ display: 'flex', borderTop: `1px solid ${INK.rule}`, paddingTop: 28 }}>{footer}</div>
            </div>
        </div>
    );
}

function PostCard({ card }: { card: Extract<Card, { kind: 'post' }> }) {
    // Long titles step down a size, then clip so they stay within four lines
    const size = card.title.length > 110 ? 50 : card.title.length > 64 ? 60 : 70;
    return (
        <Glass
            header={
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Tile src={card.communityIcon} label={card.community} size={48} radius={13} />
                    <span style={{ fontSize: 30, fontWeight: 600, color: INK.text }}>{card.community}</span>
                </div>
            }
            footer={
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, fontWeight: 500, color: INK.text }}>
                        <Avatar src={card.avatar} size={48} />
                        {card.author && <span>{clip(card.author, 30)}</span>}
                    </div>
                    <Stats stats={card.stats} />
                </div>
            }
        >
            <div style={{ display: 'flex', maxWidth: 1000, fontSize: size, fontWeight: 600, lineHeight: 1.12, letterSpacing: -1.8, color: INK.text }}>
                {clip(card.title, 170)}
            </div>
        </Glass>
    );
}

// Communities and profiles: a big picture beside the name
function SubjectCard({ card }: { card: Exclude<Card, { kind: 'post' }> }) {
    const community = card.kind === 'community';
    const subtitle = community ? card.description : card.handle;
    return (
        <Glass footer={<Stats stats={card.stats} />}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
                {community ? (
                    <div style={{ display: 'flex', borderRadius: 38, boxShadow: '0 18px 40px rgba(0,0,0,0.35)' }}>
                        <Tile src={card.icon} label={card.name} size={150} radius={38} />
                    </div>
                ) : (
                    <div style={{ display: 'flex', padding: 6, borderRadius: 999, background: INK.glass, border: `1px solid ${INK.rim}` }}>
                        <Avatar src={card.avatar} size={150} />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
                    <span style={{ fontSize: 76, fontWeight: 600, lineHeight: 1, letterSpacing: -2.2, color: INK.text }}>{clip(card.name, 20)}</span>
                    {subtitle && (
                        <span style={{ fontSize: community ? 30 : 32, fontWeight: 400, lineHeight: 1.35, color: INK.muted }}>
                            {clip(subtitle, community ? 96 : 40)}
                        </span>
                    )}
                </div>
            </div>
        </Glass>
    );
}

// The default image: the logo large with the line under it
function SiteCard() {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 44,
                background: INK.background,
                backgroundImage: INK.light,
                fontFamily: 'Hanken Grotesk',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={APP_ICON} width={132} height={132} alt="" style={{ borderRadius: 30, boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }} />
                <span style={{ fontSize: 116, fontWeight: 600, letterSpacing: -3.5, color: INK.text }}>{LOGO_TEXT}</span>
            </div>
            <span style={{ fontSize: 36, fontWeight: 400, letterSpacing: -0.3, color: INK.muted }}>{SITE_LINE}</span>
        </div>
    );
}

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
    const { kind, id } = await params;
    const card = kind === 'site' ? null : await cardFor(kind, id);
    const image = !card ? <SiteCard /> : card.kind === 'post' ? <PostCard card={card} /> : <SubjectCard card={card} />;
    return new ImageResponse(image, { ...SIZE, fonts: await loadFonts(), headers: { 'Cache-Control': CACHE } });
}
