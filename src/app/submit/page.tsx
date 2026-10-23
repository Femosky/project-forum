import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { CommunitiesResponse, MyCommunitiesResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import PostComposer, { CommunityOption } from './_components/PostComposer';

export const metadata = { title: `Create a post | ${APP_NAME}`, robots: { index: false } };

type PageProps = { searchParams: Promise<{ community?: string }> };

export default async function SubmitPage({ searchParams }: PageProps) {
    const { community } = await searchParams;
    const [mine, popular] = await Promise.all([
        serverApi<MyCommunitiesResponse>('/users/me/communities'),
        serverApi<CommunitiesResponse>('/communities?sort=popular&limit=100'),
    ]);

    if (mine.status === 401 || mine.status === 403) {
        const next = encodeURIComponent(`/submit${community ? `?community=${community}` : ''}`);
        return (
            <EmptyState
                icon={<PenLine />}
                title="Sign in to post"
                description="You need an account to start a conversation."
                action={
                    <Button asChild>
                        <Link href={`/auth/login?next=${next}`}>Log in</Link>
                    </Button>
                }
            />
        );
    }

    // Communities you joined first, then the rest of the public ones you can post in
    const joined: CommunityOption[] = (mine.data?.communities ?? []).map((c) => ({ name: c.name, label: c.display_name, joined: true }));
    const joinedNames = new Set(joined.map((c) => c.name));
    const others: CommunityOption[] = (popular.data?.communities ?? [])
        .filter((c) => !joinedNames.has(c.name) && c.visibility === 'public')
        .map((c) => ({ name: c.name, label: c.display_name, joined: false }));

    return (
        <div className="mx-auto w-full max-w-content px-4 py-4">
            <h1 className="mb-4 text-2xl font-extrabold">Create a post</h1>
            <PostComposer communities={[...joined, ...others]} initialCommunity={community} />
        </div>
    );
}
