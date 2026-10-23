import { APIUtility } from '@/lib/utils/APIUtility';
import { PostPreview } from './_components/PostPreview';
import { APP_NAME } from '@/lib/constants';
import { PostsResponse } from '@/types/api';

export async function generateMetadata() {
    return {
        title: `Home | ${APP_NAME}`,
        description: 'Home',
    };
}

export default async function Home() {
    // const params = {
    //     community_name: 'hi',
    // };

    // const url = new URL(`${APIUtility.getApiUrl()}/hi/posts`);
    // url.search = new URLSearchParams(params).toString();

    const response = await fetch(`${APIUtility.getApiUrl()}/community/hi/posts`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        return <div>Failed to fetch posts</div>;
    }
    const data: PostsResponse = await response.json();
    const posts = data.posts;

    return (
        <div className="flex flex-col gap-2 items-center justify-center ">
            {posts.map((post) => {
                return <PostPreview key={post.id} post={post} />;
            })}
        </div>
    );
}
