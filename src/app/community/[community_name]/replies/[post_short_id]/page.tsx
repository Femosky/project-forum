import { APIUtility } from '@/lib/utils/APIUtility';
import { CommentsSection } from './_components/CommentsSection';
import { PostDetailResponse } from '@/types/api';
import PostCard from '@/components/post/PostCard';
import EmptyState from '@/components/ui/EmptyState';
import { FileQuestion } from 'lucide-react';

interface PageProps {
    params: Promise<{ community_name: string; post_short_id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { community_name, post_short_id } = await params;
    const response = await fetch(`${APIUtility.getApiUrl()}/community/${community_name}/replies/${post_short_id}`).catch(
        () => null
    );
    if (!response?.ok) {
        return {
            title: 'Post not found',
            description: 'Post not found',
        };
    }
    const data: PostDetailResponse = await response.json();

    return {
        title: `${data.post.title} | ${data.post.community_ref.name} community`,
        description: data.post.ai_summary || data.post.content.slice(0, 160),
    };
}

export default async function PostPage({ params }: PageProps) {
    const { community_name, post_short_id } = await params;

    const response = await fetch(`${APIUtility.getApiUrl()}/community/${community_name}/replies/${post_short_id}`).catch(
        () => null
    );

    if (!response?.ok) {
        return (
            <EmptyState
                icon={<FileQuestion />}
                title="Post not found"
                description="It may have been removed, or the link is wrong."
            />
        );
    }

    const data: PostDetailResponse = await response.json();

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-2 sm:py-4">
            <PostCard post={data.post} variant="full" className="sm:px-4" />

            {/* Reply box and comments */}
            <section id="comments" aria-label="Comments" className="scroll-mt-header px-4">
                <CommentsSection
                    initialComments={data.comments}
                    postId={data.post.id}
                    postShortId={data.post.short_id}
                    communityName={data.post.community_ref.name}
                />
            </section>
        </div>
    );
}
