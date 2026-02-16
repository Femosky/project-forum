// app/community/[community_name]/page.tsx

import { APIUtility } from '@/lib/utils/APIUtility';

interface PageProps {
    params: Promise<{ community_name: string }>;
}

export default async function CommunityPage({ params }: PageProps) {
    const communityName = (await params).community_name;
    const res = await fetch(`${APIUtility.getApiUrl()}/community/${communityName}`, {
        cache: 'no-store',
    });

    console.log('community name: ', communityName);
    if (!res.ok) {
        return <div>Community not found</div>;
    }

    const data = await res.json();

    return (
        <div>
            <h1>{data.community.name}</h1>
            <p>{data.community._count.members} members</p>
            <p>{data.community._count.posts} posts</p>
        </div>
    );
}
