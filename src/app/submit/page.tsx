import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { CommunitiesResponse, MyCommunitiesResponse, UserResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import PostComposer, { CommunityOption } from './_components/PostComposer';

export const metadata = { title: `Create a post | ${APP_NAME}`, robots: { index: false } };

type PageProps = { searchParams: Promise<{ community?: string }> };

export default async function SubmitPage({ searchParams }: PageProps) {
    const { community } = await searchParams;
    const [mine, popular, me] = await Promise.all([
        serverApi<MyCommunitiesResponse>('/users/me/communities'),
        serverApi<CommunitiesResponse>('/communities?sort=popular&limit=30'),
        serverApi<UserResponse>('/auth/me'),
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

    // Communities you joined, and popular public ones to suggest; the picker searches for the rest
    const joined: CommunityOption[] = (mine.data?.communities ?? []).map((c) => ({ name: c.name, label: c.display_name, image: c.image_url, joined: true }));
    const joinedNames = new Set(joined.map((c) => c.name));
    const others: CommunityOption[] = (popular.data?.communities ?? [])
        .filter((c) => !joinedNames.has(c.name) && c.visibility === 'public')
        .map((c) => ({ name: c.name, label: c.display_name, image: c.image_url, joined: false }));

    return (
        <div className="mx-auto w-full max-w-content px-4 py-4">
            <h1 className="mb-4 text-2xl font-extrabold">Create a post</h1>
            <PostComposer
                joined={joined}
                popular={others}
                initialCommunity={community}
                canPostLinks={me.data?.user.can_post_links ?? true}
                canPostAnonymously={me.data?.user.can_post_anonymously ?? true}
            />
        </div>
    );
}
