import { communityHandle } from '@/lib/communityName';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, CloudOff } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { Comment, CommentsResponse, CommunityResponse, Post, PostResponse, RelatedPostsResponse } from '@/types/api';
import PostCard, { communityLabel, getPostPath } from '@/components/post/PostCard';
import PageBar from '@/components/layout/PageBar';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import JsonLd from '@/components/common/JsonLd';
import RelatedThreads from '@/components/post/RelatedThreads';
import { breadcrumbJsonLd, discussionJsonLd, noindexMetadata, pageMetadata, postTitle, summarize } from '@/lib/seo';
import { CommentsSection } from '../_components/CommentsSection';
import { COMMENT_PAGE_SIZE, DEFAULT_COMMENT_SORT, commentsQuery } from '../_components/commentsApi';
import { loadAds } from '@/ads/server';
import { slotsBetween } from '@/ads/config';
import PostViewBeacon from '@/components/post/PostViewBeacon';
import ShareButton from '@/components/post/ShareButton';
import SaveButton from '@/components/post/SaveButton';

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
            section: `c/${communityHandle(post.community)}`,
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

// Ids of every comment in the loaded tree, for counting which comments were on screen
function flattenIds(comments: Comment[]): string[] {
    return comments.flatMap((comment) => [comment.id, ...flattenIds(comment.replies ?? [])]);
}

export default async function PostPage({ params, searchParams }: PageProps) {
    const { community, short_id, slug } = await params;
    const { comment: focusId } = await searchParams;

    const [postResult, commentsResult, focused, related, ads] = await Promise.all([
        serverApi<PostResponse>(`/posts/${encodeURIComponent(short_id)}`),
        focusId
            ? null
            : serverApi<CommentsResponse>(`/posts/${encodeURIComponent(short_id)}/comments?${commentsQuery(DEFAULT_COMMENT_SORT, COMMENT_PAGE_SIZE)}`),
        focusId ? loadFocusedThread(focusId) : null,
        serverApi<RelatedPostsResponse>(`/posts/${encodeURIComponent(short_id)}/related`),
        // No ads in the single-comment view. The API skips locked, removed and NSFW threads itself.
        focusId ? [] : loadAds('thread', { post: short_id }, slotsBetween(0, COMMENT_PAGE_SIZE, 'thread')),
    ]);

    // Missing, removed and private posts, and deleted ones with no comments left. Crawlers already got a 404 or
    // 410 from the proxy. A deleted post with comments comes back as a tombstone and renders below.
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
        <>
        <PageBar
            title={
                <Link href={`/c/${post.community.name}`} className="flex min-w-0 items-center gap-2 hover:underline">
                    <Avatar name={post.community.name} src={post.community.image_url} shape="square" className="size-[18px] text-[10px]" />
                    <span className="truncate">{communityLabel(post.community)}</span>
                    <span className="font-medium text-subtle">/</span>
                    <span className="font-medium text-subtle">Post</span>
                </Link>
            }
            actions={
                post.status !== 'deleted' && (
                    <>
                        <ShareButton path={getPostPath(post)} title={post.title} inBar />
                        <SaveButton postId={post.id} saved={post.viewer?.saved} />
                    </>
                )
            }
        />
        <div className="mx-auto flex w-full max-w-[46rem] flex-col sm:px-5">
            <JsonLd
                data={[
                    discussionJsonLd(post, canonical, showingOneThread ? [] : comments),
                    breadcrumbJsonLd([
                        { name: APP_NAME, path: '/' },
                        { name: `c/${communityHandle(post.community)}`, path: `/c/${post.community.name}` },
                        { name: post.title, path: canonical },
                    ]),
                ]}
            />
            <PostViewBeacon postId={post.id} commentIds={flattenIds(comments)} />
            {post.status === 'pending' && (
                <p role="status" className="mx-4 mt-4 rounded-[10px] bg-active px-4 py-3 text-sm text-text sm:mx-0">
                    {isModerator
                        ? 'This post is waiting in the mod queue. Approve or remove it from the options menu.'
                        : "Your post is waiting for a moderator to review it. Only you can see it until it's approved."}
                </p>
            )}
            <PostCard post={post} variant="full" isModerator={isModerator} />

            {/* Reply box and comments */}
            <section id="comments" aria-label="Comments" className="scroll-mt-[calc(var(--spacing-header)+3rem)] px-4 sm:px-0">
                {showingOneThread && (
                    <div className="my-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[10px] bg-active px-4 py-3 text-sm">
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
                    isLocked={post.status === 'locked' || post.status === 'deleted'}
                    isPostDeleted={post.status === 'deleted'}
                    isModerator={isModerator}
                    commentCount={post.comment_count}
                    opUsername={post.author?.username ?? null}
                    initialComments={showingOneThread ? (focusedInPost ? [focusedInPost] : []) : comments}
                    initialCursor={showingOneThread ? null : (commentsResult?.data?.next_cursor ?? null)}
                    loadFailed={!showingOneThread && !commentsResult?.data}
                    isSingleThread={showingOneThread}
                    ads={ads}
                />
            </section>

            {related.data && <RelatedThreads community={post.community.name} {...related.data} />}
        </div>
        </>
    );
}
