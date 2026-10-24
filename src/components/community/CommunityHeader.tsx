'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Community, CommunityViewer, MembershipResponse } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import NumberUtility from '@/lib/utils/NumberUtility';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUIStore } from '@/lib/uiStore';

type MembershipState = 'member' | 'requested' | 'none';

function initialState(viewer: CommunityViewer | null): MembershipState {
    if (viewer?.is_member) return 'member';
    if (viewer?.has_pending_request) return 'requested';
    return 'none';
}

export function CommunityHeader({ community, viewer }: { community: Community; viewer: CommunityViewer | null }) {
    const [membership, setMembership] = useState<MembershipState>(initialState(viewer));
    const [members, setMembers] = useState(community.member_count);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requireAuth = useRequireAuth();
    const membershipChanged = useUIStore((state) => state.membershipChanged);
    const router = useRouter();
    const isOwner = viewer?.role === 'owner';

    async function toggleMembership() {
        if (!requireAuth('join')) return;
        const leaving = membership === 'member';
        const previous = { membership, members };
        setError(null);
        setIsBusy(true);
        // Joining a public community is near-certain to succeed, so show it straight away
        if (leaving) {
            setMembership('none');
            setMembers((count) => count - 1);
        } else if (community.visibility === 'public') {
            setMembership('member');
            setMembers((count) => count + 1);
        }

        try {
            const result = await api<MembershipResponse>(`/communities/${community.name}/membership`, {
                method: leaving ? 'DELETE' : 'PUT',
                body: leaving ? undefined : {},
            });
            if (result.status === 'requested') setMembership('requested');
            if (result.status === 'joined' && community.visibility !== 'public') {
                setMembership('member');
                setMembers((count) => count + 1);
            }
            membershipChanged();
            // The feed and post list may change with membership
            router.refresh();
        } catch (error) {
            setMembership(previous.membership);
            setMembers(previous.members);
            setError(errorMessage(error));
        } finally {
            setIsBusy(false);
        }
    }

    const label = membership === 'member' ? 'Joined' : membership === 'requested' ? 'Requested' : 'Join';
    const joinButton = (className: string) =>
        isOwner ? null : (
            <Button
                className={className}
                variant={membership === 'none' ? 'primary' : 'outline'}
                onClick={toggleMembership}
                disabled={isBusy || membership === 'requested'}
                aria-pressed={membership === 'member'}
            >
                {label}
            </Button>
        );

    return (
        <header className="flex flex-col gap-4 border-b border-border bg-surface px-4 py-5 sm:rounded-xl sm:border">
            <div className="flex items-center gap-4">
                <Avatar name={community.name} src={community.image_url} size="xl" shape="square" />
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-extrabold">{community.display_name ?? `c/${community.name}`}</h1>
                    <p className="text-sm text-muted">
                        {community.display_name && <span>c/{community.name} • </span>}
                        <span className="tabular-nums">{NumberUtility.compactFormatter.format(members)}</span>{' '}
                        {members === 1 ? 'member' : 'members'} •{' '}
                        <span className="tabular-nums">{NumberUtility.compactFormatter.format(community.post_count)}</span>{' '}
                        {community.post_count === 1 ? 'post' : 'posts'}
                    </p>
                </div>
                {joinButton('hidden sm:inline-flex')}
            </div>

            {joinButton('w-full sm:hidden')}
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
        </header>
    );
}

export default CommunityHeader;
