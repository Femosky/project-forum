import { Community } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import NumberUtility from '@/lib/utils/NumberUtility';

// Join isn't wired to the API yet (Phase 3)
export function CommunityHeader({ community }: { community: Community }) {
    const members = community._count?.members ?? 0;
    const posts = community._count?.posts ?? 0;

    return (
        <header className="flex flex-col gap-4 border-b border-border bg-surface px-4 py-5 sm:rounded-xl sm:border">
            <div className="flex items-center gap-4">
                <Avatar name={community.name} src={community.image_url} size="xl" />
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-extrabold">c/{community.name}</h1>
                    <p className="text-sm text-muted">
                        <span className="tabular-nums">{NumberUtility.compactFormatter.format(members)}</span>{' '}
                        {members === 1 ? 'member' : 'members'} •{' '}
                        <span className="tabular-nums">{NumberUtility.compactFormatter.format(posts)}</span>{' '}
                        {posts === 1 ? 'post' : 'posts'}
                    </p>
                </div>
                <Button className="hidden sm:inline-flex">Join</Button>
            </div>

            {community.description && <p className="text-sm">{community.description}</p>}

            <Button className="w-full sm:hidden">Join</Button>
        </header>
    );
}

export default CommunityHeader;
