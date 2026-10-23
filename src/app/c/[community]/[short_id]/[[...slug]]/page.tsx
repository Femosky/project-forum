import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { Comment, CommentsResponse, CommunityResponse, PostResponse } from '@/types/api';
import PostCard, { getPostPath } from '@/components/post/PostCard';
import EmptyState from '@/components/ui/EmptyState';
import { stripMarkdown } from '@/components/common/Markdown';
import { CommentsSection } from '../_components/CommentsSection';
import { COMMENT_PAGE_SIZE, DEFAULT_COMMENT_SORT, commentsQuery } from '../_components/commentsApi';

type PageProps = {
    params: Promise<{ community: string; short_id: string; slug?: string[] }>;
    // ?comment={id} shows just that comment and its replies (deep links, "continue this thread")
    searchParams: Promise<{ comment?: string }>;
};

type SingleCommentResponse = { comment: Comment };

export async function generateMetadata({ params }: PageProps) {
    const { short_id } = await params;
    const { data } = await serverApi<PostResponse>(`/posts/${encodeURIComponent(short_id)}`);
    if (!data) return { title: `Post not found | ${APP_NAME}` };

    const { post } = data;
    return {
        title: `${post.title} | c/${post.community.name}`,
        description: (post.ai_summary || stripMarkdown(post.body) || post.title).slice(0, 160),
        alternates: { canonical: getPostPath(post) },
    };
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

    const [postResult, commentsResult, focused] = await Promise.all([
        serverApi<PostResponse>(`/posts/${encodeURIComponent(short_id)}`),
        focusId
            ? null
            : serverApi<CommentsResponse>(`/posts/${encodeURIComponent(short_id)}/comments?${commentsQuery(DEFAULT_COMMENT_SORT, COMMENT_PAGE_SIZE)}`),
        focusId ? loadFocusedThread(focusId) : null,
    ]);

    if (!postResult.data) {
        return (
            <EmptyState
                icon={<FileQuestion />}
                title="Post not found"
                description="It may have been removed, or the link is wrong."
            />
        );
    }

    const { post } = postResult.data;

    // One URL per thread: fix a wrong community name or a missing/old slug
    const canonical = getPostPath(post);
    if (community !== post.community.name || (slug?.[0] ?? '') !== (post.slug ?? '') || (slug?.length ?? 0) > 1) {
        permanentRedirect(focusId ? `${canonical}?comment=${encodeURIComponent(focusId)}` : canonical);
    }

    // Moderators get remove/lock/pin on the post and its comments
    const membership = post.viewer ? await serverApi<CommunityResponse>(`/communities/${post.community.name}`) : null;
    const role = membership?.data?.viewer?.role;
    const isModerator = role === 'owner' || role === 'moderator';

    const showingOneThread = Boolean(focusId);
    const focusedInPost = focused && focused.post_id === post.id ? focused : null;

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-2 sm:py-4">
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
                    initialComments={showingOneThread ? (focusedInPost ? [focusedInPost] : []) : (commentsResult?.data?.comments ?? [])}
                    initialCursor={showingOneThread ? null : (commentsResult?.data?.next_cursor ?? null)}
                    loadFailed={!showingOneThread && !commentsResult?.data}
                    isSingleThread={showingOneThread}
                />
            </section>
        </div>
    );
}
