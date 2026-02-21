// app/community/[community_name]/page.tsx

import { APIUtility } from '@/lib/utils/APIUtility';

interface PageProps {
    params: Promise<{ community_name: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { community_name } = await params;
    const response = await fetch(`${APIUtility.getApiUrl()}/community/${community_name}`, {
        cache: 'no-store',
    });
    if (!response.ok) {
        return {
            title: 'Community not found',
            description: 'Community not found',
        };
    }
    const data = await response.json();

    return {
        title: `${data.community.name} community`,
        description: data.community.description,
    };
}

export default async function CommunityPage({ params }: PageProps) {
    const { community_name } = await params;
    const response = await fetch(`${APIUtility.getApiUrl()}/community/${community_name}`, {
        cache: 'no-store',
    });

    if (!response.ok) {
        return <div>Community not found</div>;
    }

    const data = await response.json();

    return (
        <div>
            <h1>{data.community.name}</h1>
            <p>{data.community._count.members} members</p>
            <p>{data.community._count.posts} posts</p>
        </div>
    );
}
