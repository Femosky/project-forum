import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, CloudOff } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { Comment, CommentsResponse, CommunityResponse, Post, PostResponse, RelatedPostsResponse } from '@/types/api';
import PostCard, { getPostPath } from '@/components/post/PostCard';
import EmptyState from '@/components/ui/EmptyState';
import JsonLd from '@/components/common/JsonLd';
import RelatedThreads from '@/components/post/RelatedThreads';
import type { Metadata } from 'next';
import { breadcrumbJsonLd, discussionJsonLd, noindexMetadata, pageMetadata, postTitle, summarize } from '@/lib/seo';
import { CommentsSection } from '@/app/c/[community]/[short_id]/_components/CommentsSection';
import { COMMENT_PAGE_SIZE, DEFAULT_COMMENT_SORT, commentsQuery } from '@/app/c/[community]/[short_id]/_components/commentsApi';
import { loadAds } from '@/ads/server';
import { slotsBetween } from '@/ads/config';

type SingleCommentResponse = { comment: Comment };

// The canonical URL for this request, or null when it already is canonical
function redirectTarget(post: Post, community: string, slug: string[] | undefined, focusId: string | undefined): string | null {
    const canonical = getPostPath(post);
    if (community === post.community.name && (slug?.[0] ?? '') === (post.slug ?? '') && (slug?.length ?? 0) <= 1) return null;
    return focusId ? `${canonical}?comment=${encodeURIComponent(focusId)}` : canonical;
}

// One comment with its replies, loaded the same way the thread loads them
async function loadFocusedThread(commentId: string): Promise<Comment | null> {
    const id = encodeURIComponent(commentId);
    const [single, replies] = await Promise.all([
        serverApi<SingleCommentResponse>(`/comments/${id}`),
        serverApi<CommentsResponse>(`/comments/${id}/replies?${commentsQuery(DEFAULT_COMMENT_SORT, COMMENT_PAGE_SIZE)}`),
    ]);
    if (!single.data) return null;
    const loaded = replies.data?.comments ?? [];
    return { ...single.data.comment, replies: loaded, more_replies: Math.max(single.data.comment.reply_count - loaded.length, 0) };
}

// Shared by the post page and the split-view reader (app/@reader), which shows the same thread beside a list
export async function postMetadata(shortId: string): Promise<Metadata> {
    const { data } = await serverApi<PostResponse>(`/posts/${encodeURIComponent(shortId)}`);
    if (!data) return noindexMetadata(`Post not found | ${APP_NAME}`);

    const { post } = data;
    const fallback = `${post.comment_count} ${post.comment_count === 1 ? 'comment' : 'comments'} in c/${post.community.name}`;
    return pageMetadata({
        title: postTitle(post),
        description: summarize(post.ai_summary || post.body || post.link_preview?.description || '') || fallback,
        path: getPostPath(post),
        image: `/og/post/${post.short_id}`,
        // Removed posts (seen by moderators), posts by brand-new accounts and very short posts stay out of the index
        noindex: !post.is_indexable,
        openGraph: {
            type: 'article',
            publishedTime: post.created_at,
            modifiedTime: post.edited_at ?? undefined,
            section: `c/${post.community.name}`,
            authors: post.author ? [`/u/${post.author.username}`] : undefined,
        },
    });
}

type PostThreadProps = {
    shortId: string;
    focusId?: string;
    // The post page passes the URL it was asked for, to redirect to the canonical one and add structured data.
    // The split-view reader leaves it out: its links are already canonical and the page underneath isn't the post.
    canonical?: { community: string; slug?: string[] };
};

// A post with its comments and related threads: the post page, and the reading pane of the split view
export default async function PostThread({ shortId, focusId, canonical: requested }: PostThreadProps) {
    const [postResult, commentsResult, focused, related, ads] = await Promise.all([
        serverApi<PostResponse>(`/posts/${encodeURIComponent(shortId)}`),
        focusId
            ? null
            : serverApi<CommentsResponse>(`/posts/${encodeURIComponent(shortId)}/comments?${commentsQuery(DEFAULT_COMMENT_SORT, COMMENT_PAGE_SIZE)}`),
        focusId ? loadFocusedThread(focusId) : null,
        serverApi<RelatedPostsResponse>(`/posts/${encodeURIComponent(shortId)}/related`),
        // No ads in the single-comment view. The API skips locked, removed and NSFW threads itself.
        focusId ? [] : loadAds('thread', { post: shortId }, slotsBetween(0, COMMENT_PAGE_SIZE, 'thread')),
    ]);

    // Missing, deleted, removed and private posts. Crawlers already got a 404 or 410 from the proxy.
    if (postResult.status === 404 || postResult.status === 403) notFound();
    if (!postResult.data) {
        return <EmptyState icon={<CloudOff />} title="Couldn't load this post" description="Try again in a moment." />;
    }

    const { post } = postResult.data;

    // One URL per thread: fix a wrong community name or a missing/old slug
    const canonical = getPostPath(post);
    if (requested) {
        const target = redirectTarget(post, requested.community, requested.slug, focusId);
        if (target) permanentRedirect(target);
    }

    // Moderators get remove/lock/pin on the post and its comments
    const membership = post.viewer ? await serverApi<CommunityResponse>(`/communities/${post.community.name}`) : null;
    const role = membership?.data?.viewer?.role;
    const isModerator = role === 'owner' || role === 'moderator';

    const showingOneThread = Boolean(focusId);
    const focusedInPost = focused && focused.post_id === post.id ? focused : null;

    const comments = commentsResult?.data?.comments ?? [];

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-2 sm:py-4">
            {requested && (
                <JsonLd
                    data={[
                        discussionJsonLd(post, canonical, showingOneThread ? [] : comments),
                        breadcrumbJsonLd([
                            { name: APP_NAME, path: '/' },
                            { name: `c/${post.community.name}`, path: `/c/${post.community.name}` },
                            { name: post.title, path: canonical },
                        ]),
                    ]}
                />
            )}
            {post.status === 'pending' && (
                <p role="status" className="mx-4 rounded-xl bg-highlight px-4 py-3 text-sm text-highlight-fg">
                    {isModerator
                        ? 'This post is waiting in the mod queue. Approve or remove it from the options menu.'
                        : "Your post is waiting for a moderator to review it. Only you can see it until it's approved."}
                </p>
            )}
            <PostCard post={post} variant="full" isModerator={isModerator} className="sm:px-4" />

            {/* Reply box and comments */}
            <section id="comments" aria-label="Comments" className="scroll-mt-header px-4">
                {showingOneThread && (
                    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-surface-muted px-4 py-3 text-sm">
                        <span className="text-muted">
                            {focusedInPost ? "You're viewing one comment and its replies." : "That comment isn't available."}
                        </span>
                        <Link href={`${canonical}#comments`} className="inline-flex items-center gap-1 font-semibold text-link hover:underline">
                            <ArrowLeft className="size-4" /> All comments
                        </Link>
                        {focusedInPost?.parent_id && (
                            <Link href={`${canonical}?comment=${focusedInPost.parent_id}`} className="font-semibold text-link hover:underline">
                                Parent comment
                            </Link>
                        )}
                    </div>
                )}
                <CommentsSection
                    postId={post.id}
                    postPath={canonical}
                    isLocked={post.status === 'locked'}
                    isModerator={isModerator}
                    commentCount={post.comment_count}
                    initialComments={showingOneThread ? (focusedInPost ? [focusedInPost] : []) : comments}
                    initialCursor={showingOneThread ? null : (commentsResult?.data?.next_cursor ?? null)}
                    loadFailed={!showingOneThread && !commentsResult?.data}
                    isSingleThread={showingOneThread}
                    ads={ads}
                />
            </section>

            {related.data && <RelatedThreads community={post.community.name} {...related.data} />}
        </div>
    );
}
