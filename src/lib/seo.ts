import { communityHandle } from '@/lib/communityName';
import type { Metadata } from 'next';
import { APP_DESCRIPTION, APP_NAME, APP_URL, SITE_OG_LOCALE, TWITTER_HANDLE } from '@/lib/constants';
import { stripMarkdown } from '@/components/common/Markdown';
import type { Comment, Community, Post, PublicUser } from '@/types/api';

// Page metadata and structured data in one place, so every indexable page gets the same set of tags:
// title, description, canonical, Open Graph, Twitter card and robots.

export function absoluteUrl(path: string): string {
    return new URL(path, `${APP_URL}/`).toString();
}

// Plain text cut at a word boundary, for meta descriptions (Google shows about 155 characters)
export function summarize(markdown: string, max = 155): string {
    const text = stripMarkdown(markdown);
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:!?-]+$/, '')}…`;
}

type PageMetadataInput = {
    // The full <title>
    title: string;
    description?: string;
    // Canonical path, e.g. /c/lounge; always without sort or paging parameters
    path: string;
    // Share image path, 1200×630
    image?: string;
    imageAlt?: string;
    // Keep the page out of the index but let crawlers follow its links (paging, sorts, thin posts)
    noindex?: boolean;
    // Mature (NSFW): kept out of the index and marked rating=adult, so SafeSearch filters it
    mature?: boolean;
    openGraph?: Metadata['openGraph'];
};

const NOINDEX: Metadata['robots'] = { index: false, follow: true };

export function pageMetadata({ title, description = APP_DESCRIPTION, path, image = '/og/site/default', imageAlt, noindex, mature, openGraph }: PageMetadataInput): Metadata {
    const images = [{ url: image, width: 1200, height: 630, alt: imageAlt ?? title }];
    return {
        title,
        description,
        alternates: { canonical: path },
        robots: noindex || mature ? NOINDEX : undefined,
        ...(mature ? { other: { rating: 'adult' } } : {}),
        openGraph: {
            type: 'website',
            siteName: APP_NAME,
            locale: SITE_OG_LOCALE,
            url: path,
            title,
            description,
            images,
            ...openGraph,
        } as Metadata['openGraph'],
        twitter: { card: 'summary_large_image', site: TWITTER_HANDLE, title, description, images: [image] },
    };
}

export const noindexMetadata = (title: string): Metadata => ({ title, robots: NOINDEX });

// "{post title} : c/{community}" like the big forums, dropping the community when that would run past ~60
// characters so the post's own words are what show in results
export function postTitle(post: Pick<Post, 'title' | 'community'>): string {
    const full = `${post.title} : c/${post.community.name}`;
    return full.length <= 60 ? full : post.title;
}

// --- JSON-LD (schema.org) ---

function personFor(author: Post['author'], isAnonymous: boolean) {
    if (!author) return { '@type': 'Person', name: isAnonymous ? 'Anonymous' : '[deleted]' };
    return { '@type': 'Person', name: author.username, url: absoluteUrl(`/u/${author.username}`) };
}

function counters(upvotes: number, comments?: number) {
    return [
        { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: upvotes },
        ...(comments === undefined
            ? []
            : [{ '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: comments }]),
    ];
}

const MAX_COMMENT_TEXT = 1500;

function commentJsonLd(comment: Comment, postUrl: string): object | null {
    if (comment.status === 'deleted' || comment.status === 'removed') return null;
    const replies = (comment.replies ?? []).map((reply) => commentJsonLd(reply, postUrl)).filter(Boolean);
    return {
        '@type': 'Comment',
        url: `${postUrl}?comment=${comment.short_id}`,
        text: stripMarkdown(comment.body).slice(0, MAX_COMMENT_TEXT),
        datePublished: comment.created_at,
        ...(comment.edited_at ? { dateModified: comment.edited_at } : {}),
        author: personFor(comment.author, comment.is_anonymous),
        interactionStatistic: counters(comment.upvote_count),
        ...(replies.length ? { comment: replies } : {}),
    };
}

// The thread itself, with its top comments. Google reads DiscussionForumPosting for forum threads.
export function discussionJsonLd(post: Post, path: string, comments: Comment[]) {
    const url = absoluteUrl(path);
    return {
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        '@id': url,
        mainEntityOfPage: url,
        url,
        headline: post.title,
        text: stripMarkdown(post.body) || undefined,
        image: absoluteUrl(`/og/post/${post.short_id}`),
        datePublished: post.created_at,
        ...(post.edited_at ? { dateModified: post.edited_at } : {}),
        author: personFor(post.author, post.is_anonymous),
        isPartOf: { '@type': 'WebPage', name: `c/${communityHandle(post.community)}`, url: absoluteUrl(`/c/${post.community.name}`) },
        ...(post.url ? { sharedContent: { '@type': 'WebPage', url: post.url } } : {}),
        interactionStatistic: counters(post.upvote_count, post.comment_count),
        comment: comments
            .slice(0, 10)
            .map((comment) => commentJsonLd(comment, url))
            .filter(Boolean),
    };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: absoluteUrl(item.path),
        })),
    };
}

export function websiteJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: APP_NAME,
        description: APP_DESCRIPTION,
        url: absoluteUrl('/'),
        potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${absoluteUrl('/search')}?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
        },
    };
}

export function profileJsonLd(user: PublicUser) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        dateCreated: user.created_at,
        mainEntity: {
            '@type': 'Person',
            name: user.display_name ?? user.username,
            alternateName: `u/${user.username}`,
            identifier: user.username,
            url: absoluteUrl(`/u/${user.username}`),
        },
    };
}

export function communityDescription(community: Community): string {
    return community.description?.trim() || `Posts and discussions in c/${community.name} on ${APP_NAME}.`;
}
