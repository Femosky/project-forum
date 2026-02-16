import { APIUtility } from '@/lib/utils/APIUtility';
import { PostPreview } from './_components/PostPreview';

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
        throw new Error('Failed to fetch posts');
    }
    const data = await response.json();
    const posts = data.posts;
    // console.log('data: ', data);

    return (
        <div className="borderborder-green-500 flex flex-col gap-2 items-center justify-center ">
            {posts.map((post: unknown) => {
                return <PostPreview key={post.id} post={post} />;
            })}
        </div>
    );
}
