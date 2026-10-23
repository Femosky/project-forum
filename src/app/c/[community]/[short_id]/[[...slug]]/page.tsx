import { permanentRedirect } from 'next/navigation';
import { FileQuestion } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { CommentsResponse, PostResponse } from '@/types/api';
import PostCard, { getPostPath } from '@/components/post/PostCard';
import EmptyState from '@/components/ui/EmptyState';
import { stripMarkdown } from '@/components/common/Markdown';
import { CommentsSection } from '../_components/CommentsSection';
import { COMMENT_PAGE_SIZE, DEFAULT_COMMENT_SORT, commentsQuery } from '../_components/commentsApi';

type PageProps = {
    params: Promise<{ community: string; short_id: string; slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps) {
    const { short_id } = await params;
    const { data } = await serverApi<PostResponse>(`/posts/${encodeURIComponent(short_id)}`);
    if (!data) return { title: `Post not found | ${APP_NAME}` };

    const { post } = data;
    return {
        title: `${post.title} | c/${post.community.name}`,
        description: (post.ai_summary || stripMarkdown(post.body) || post.title).slice(0, 160),
    };
}

export default async function PostPage({ params }: PageProps) {
    const { community, short_id, slug } = await params;

    const [postResult, commentsResult] = await Promise.all([
        serverApi<PostResponse>(`/posts/${encodeURIComponent(short_id)}`),
        serverApi<CommentsResponse>(
            `/posts/${encodeURIComponent(short_id)}/comments?${commentsQuery(DEFAULT_COMMENT_SORT, COMMENT_PAGE_SIZE)}`
        ),
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
        permanentRedirect(canonical);
    }

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-2 sm:py-4">
            <PostCard post={post} variant="full" className="sm:px-4" />

            {/* Reply box and comments */}
            <section id="comments" aria-label="Comments" className="scroll-mt-header px-4">
                <CommentsSection
                    postId={post.id}
                    isLocked={post.status === 'locked'}
                    commentCount={post.comment_count}
                    initialComments={commentsResult.data?.comments ?? []}
                    initialCursor={commentsResult.data?.next_cursor ?? null}
                    loadFailed={!commentsResult.data}
                />
            </section>
        </div>
    );
}
