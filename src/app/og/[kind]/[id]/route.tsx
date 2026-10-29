import { communityHandle } from '@/lib/communityName';
import { ImageResponse } from 'next/og';
import { APP_NAME, BRAND_COLORS, REPUTATION_LABEL } from '@/lib/constants';
import { publicApi } from '@/lib/api/server';
import { CommunityResponse, PostResponse, PublicUserResponse } from '@/types/api';
import NumberUtility from '@/lib/utils/NumberUtility';

// Share images (1200×630 PNG) for /og/post/{shortId}, /og/c/{name}, /og/u/{username} and /og/site/default.
// Flat colours and system text keep them around 30-60 KB: WhatsApp drops large or slow images.

const SIZE = { width: 1200, height: 630 };
const CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

type Card = { eyebrow: string; title: string; stats: string[] };

const plural = (count: number, word: string) => `${NumberUtility.compactFormatter.format(count)} ${word}${count === 1 ? '' : 's'}`;

async function cardFor(kind: string, id: string): Promise<Card | null> {
    const key = encodeURIComponent(id);
    if (kind === 'post') {
        const { data } = await publicApi<PostResponse>(`/posts/${key}`, 600);
        if (!data) return null;
        const { post } = data;
        return {
            eyebrow: `c/${communityHandle(post.community)}`,
            title: post.title,
            stats: [plural(post.score, 'point'), plural(post.comment_count, 'comment')],
        };
    }
    if (kind === 'c') {
        const { data } = await publicApi<CommunityResponse>(`/communities/${key}`);
        if (!data) return null;
        const { community } = data;
        return {
            eyebrow: `c/${communityHandle(community)}`,
            title: community.display_name ?? community.description ?? `c/${communityHandle(community)}`,
            stats: [plural(community.member_count, 'member'), plural(community.post_count, 'post')],
        };
    }
    if (kind === 'u') {
        const { data } = await publicApi<PublicUserResponse>(`/users/${key}`);
        if (!data) return null;
        return { eyebrow: 'Profile', title: data.user.display_name ?? `u/${data.user.username}`, stats: [plural(data.user.karma, `${REPUTATION_LABEL} point`)] };
    }
    return null;
}

const SITE_CARD: Card = { eyebrow: APP_NAME, title: 'Ask questions, share what you know, get real answers.', stats: [] };

export async function GET(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
    const { kind, id } = await params;
    const card = (kind === 'site' ? SITE_CARD : await cardFor(kind, id)) ?? SITE_CARD;
    // Very long titles shrink so they still fit in four lines
    const titleSize = card.title.length > 110 ? 48 : card.title.length > 60 ? 60 : 72;
    const title = card.title.length > 180 ? `${card.title.slice(0, 177).trimEnd()}…` : card.title;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '64px 72px',
                    background: BRAND_COLORS.background,
                    color: BRAND_COLORS.text,
                }}
            >
                <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: BRAND_COLORS.accent }}>{card.eyebrow}</div>
                <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 700, lineHeight: 1.15, letterSpacing: -1 }}>{title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 30 }}>
                    <div style={{ display: 'flex', gap: 32, color: BRAND_COLORS.muted }}>
                        {card.stats.map((stat) => (
                            <span key={stat}>{stat}</span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontWeight: 700 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 10, background: BRAND_COLORS.accent }} />
                        {APP_NAME}
                    </div>
                </div>
            </div>
        ),
        { ...SIZE, headers: { 'Cache-Control': CACHE } }
    );
}
