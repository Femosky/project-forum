import Link from 'next/link';
import { CloudOff, Users } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { pageMetadata } from '@/lib/seo';
import { serverApi } from '@/lib/api/server';
import { CommunitiesResponse } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import NumberUtility from '@/lib/utils/NumberUtility';

export const metadata = pageMetadata({
    title: `Communities | ${APP_NAME}`,
    description: `Browse every community on ${APP_NAME}, from the biggest to the newest.`,
    path: '/communities',
});

// Simple directory until categories and search arrive
export default async function CommunitiesPage() {
    const { data } = await serverApi<CommunitiesResponse>('/communities?sort=popular&limit=100');

    if (!data) {
        return <EmptyState icon={<CloudOff />} title="Couldn't load communities" description="Try again in a moment." />;
    }

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 py-3 sm:px-4 sm:py-4">
            <h1 className="px-4 text-2xl font-extrabold sm:px-0">Communities</h1>
            {data.communities.length === 0 ? (
                <EmptyState icon={<Users />} title="No communities yet" />
            ) : (
                <ul className="flex flex-col divide-y divide-border bg-surface sm:rounded-xl sm:border sm:border-border">
                    {data.communities.map((community) => (
                        <li key={community.id}>
                            <Link
                                href={`/c/${community.name}`}
                                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60"
                            >
                                <Avatar name={community.name} src={community.image_url} size="lg" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-bold">c/{community.name}</p>
                                    {community.description && <p className="line-clamp-1 text-sm text-muted">{community.description}</p>}
                                </div>
                                <span className="shrink-0 text-xs text-muted">
                                    <span className="tabular-nums">{NumberUtility.compactFormatter.format(community.member_count)}</span>{' '}
                                    {community.member_count === 1 ? 'member' : 'members'}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
