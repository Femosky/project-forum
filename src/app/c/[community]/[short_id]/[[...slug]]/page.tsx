import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, CloudOff } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { Comment, CommentsResponse, CommunityResponse, Post, PostResponse, RelatedPostsResponse } from '@/types/api';
import PostCard, { getPostPath } from '@/components/post/PostCard';
import EmptyState from '@/components/ui/EmptyState';
import JsonLd from '@/components/common/JsonLd';
import RelatedThreads from '@/components/post/RelatedThreads';
import { breadcrumbJsonLd, discussionJsonLd, noindexMetadata, pageMetadata, postTitle, summarize } from '@/lib/seo';
import { CommentsSection } from '../_components/CommentsSection';
import { COMMENT_PAGE_SIZE, DEFAULT_COMMENT_SORT, commentsQuery } from '../_components/commentsApi';

type PageProps = {
    params: Promise<{ community: string; short_id: string; slug?: string[] }>;
    // ?comment={id} shows just that comment and its replies (deep links, "continue this thread")
    searchParams: Promise<{ comment?: string }>;
};

type SingleCommentResponse = { comment: Comment };

// The canonical URL for this request, or null when it already is canonical
function redirectTarget(post: Post, community: string, slug: string[] | undefined, focusId: string | undefined): string | null {
    const canonical = getPostPath(post);
    if (community === post.community.name && (slug?.[0] ?? '') === (post.slug ?? '') && (slug?.length ?? 0) <= 1) return null;
    return focusId ? `${canonical}?comment=${encodeURIComponent(focusId)}` : canonical;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { short_id } = await params;
    const { data } = await serverApi<PostResponse>(`/posts/${encodeURIComponent(short_id)}`);
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

export default async function PostPage({ params, searchParams }: PageProps) {
    const { community, short_id, slug } = await params;
    const { comment: focusId } = await searchParams;

    const [postResult, commentsResult, focused, related] = await Promise.all([
        serverApi<PostResponse>(`/posts/${encodeURIComponent(short_id)}`),
        focusId
            ? null
            : serverApi<CommentsResponse>(`/posts/${encodeURIComponent(short_id)}/comments?${commentsQuery(DEFAULT_COMMENT_SORT, COMMENT_PAGE_SIZE)}`),
        focusId ? loadFocusedThread(focusId) : null,
        serverApi<RelatedPostsResponse>(`/posts/${encodeURIComponent(short_id)}/related`),
    ]);

    // Missing, deleted, removed and private posts. Crawlers already got a 404 or 410 from the proxy.
    if (postResult.status === 404 || postResult.status === 403) notFound();
    if (!postResult.data) {
        return <EmptyState icon={<CloudOff />} title="Couldn't load this post" description="Try again in a moment." />;
    }

    const { post } = postResult.data;

    // One URL per thread: fix a wrong community name or a missing/old slug
    const canonical = getPostPath(post);
    const target = redirectTarget(post, community, slug, focusId);
    if (target) permanentRedirect(target);

    // Moderators get remove/lock/pin on the post and its comments
    const membership = post.viewer ? await serverApi<CommunityResponse>(`/communities/${post.community.name}`) : null;
    const role = membership?.data?.viewer?.role;
    const isModerator = role === 'owner' || role === 'moderator';

    const showingOneThread = Boolean(focusId);
    const focusedInPost = focused && focused.post_id === post.id ? focused : null;

    const comments = commentsResult?.data?.comments ?? [];

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-2 sm:py-4">
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
                />
            </section>

            {related.data && <RelatedThreads community={post.community.name} {...related.data} />}
        </div>
    );
}
