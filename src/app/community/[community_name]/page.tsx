// app/community/[community_name]/page.tsx

import { APIUtility } from '@/lib/utils/APIUtility';
import { CommunityResponse } from '@/types/api';
import CommunityHeader from '@/components/community/CommunityHeader';
import EmptyState from '@/components/ui/EmptyState';
import { MessagesSquare, Users } from 'lucide-react';

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
    const data: CommunityResponse = await response.json();

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
        return (
            <EmptyState
                icon={<Users />}
                title="Community not found"
                description="Check the name, or browse other communities."
            />
        );
    }

    const data: CommunityResponse = await response.json();

    // TODO(Phase 3): community post list with sort
    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 sm:px-4 sm:py-4">
            <CommunityHeader community={data.community} />
            <EmptyState icon={<MessagesSquare />} title="Posts are coming" description="This community's posts will show here." />
        </div>
    );
}
