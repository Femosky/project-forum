import { APIUtility } from '@/lib/utils/APIUtility';
import { APP_NAME } from '@/lib/constants';
import { PostsResponse } from '@/types/api';
import PostCard from '@/components/post/PostCard';
import EmptyState from '@/components/ui/EmptyState';
import { CloudOff, MessagesSquare } from 'lucide-react';

export async function generateMetadata() {
    return {
        title: `Home | ${APP_NAME}`,
        description: 'Home',
    };
}

export default async function Home() {
    // TODO(Phase 3): replace the hard-coded community with the global feed endpoint
    const response = await fetch(`${APIUtility.getApiUrl()}/community/hi/posts`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).catch(() => null);

    if (!response?.ok) {
        return (
            <EmptyState
                icon={<CloudOff />}
                title="Couldn't load posts"
                description="Something went wrong on our side. Try again in a moment."
            />
        );
    }
    const data: PostsResponse = await response.json();
    const posts = data.posts;

    return (
        <div className="mx-auto w-full max-w-content sm:px-4 sm:py-4">
            {posts.length === 0 ? (
                <EmptyState icon={<MessagesSquare />} title="No posts yet" description="Be the first to start a conversation." />
            ) : (
                <div className="flex flex-col divide-y divide-border sm:gap-3 sm:divide-y-0">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}
