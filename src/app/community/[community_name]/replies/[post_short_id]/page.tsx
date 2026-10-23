import { APIUtility } from '@/lib/utils/APIUtility';
import Link from 'next/link';
import { PostOptions } from './_components/PostOptions';
import { PostActions } from '@/app/_components/PostActions';
import { CommentsSection } from './_components/CommentsSection';
import { PostDetailResponse } from '@/types/api';

interface PageProps {
    params: Promise<{ community_name: string; post_short_id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { community_name, post_short_id } = await params;
    const response = await fetch(`${APIUtility.getApiUrl()}/community/${community_name}/replies/${post_short_id}`);
    if (!response.ok) {
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

    const response = await fetch(`${APIUtility.getApiUrl()}/community/${community_name}/replies/${post_short_id}`);

    if (!response.ok) {
        return <div>Failed to fetch replies</div>;
    }

    const data: PostDetailResponse = await response.json();

    return (
        <div className="md:py-4">
            <div className="flex flex-col gap-6 w-[var(--main-page-width)] max-w-full mx-auto">
                {/* Post section */}
                <div className="w-full flex flex-col gap-4 items-center">
                    <TopSection buttonZIndex="z-10" communityName={data.post.community_ref.name} />

                    <ContentSection title={data.post.title} content={data.post.content} />

                    <PostActions
                        className="w-full justify-baseline"
                        removeInvisibleButton={true}
                        buttonZIndex="z-10"
                        upvotes={data.post._count.upvoters}
                        downvotes={data.post._count.downvoters}
                        commentsCount={data.post._count.comments}
                    />
                </div>

                {/* Reply box and comments */}
                <CommentsSection
                    initialComments={data.comments}
                    postId={data.post.id}
                    postShortId={data.post.short_id}
                    communityName={data.post.community_ref.name}
                />
            </div>
        </div>
    );
}

function TopSection({ buttonZIndex, communityName }: { buttonZIndex: string; communityName: string }) {
    return (
        <div className="w-full flex justify-between items-center">
            <Link href={`/community/${communityName}`} className={buttonZIndex}>
                <span className="text-sm font-light hover:underline underline-offset-2 decoration-green-400 transition-colors">
                    the <span className="font-medium italic">{communityName}</span> community
                </span>
            </Link>

            <PostOptions buttonZIndex={buttonZIndex} />
        </div>
    );
}

function ContentSection({ title, content }: { title: string; content: string }) {
    return (
        <div className="w-full flex flex-col gap-2 text-start">
            <h1 className="font-semibold">{title}</h1>
            <p className="text-ellipsis">{content}</p>
        </div>
    );
}
