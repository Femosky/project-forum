import Link from 'next/link';
import { Users } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { UserResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import NewCommunityForm from './_components/NewCommunityForm';

export const metadata = { title: `Start a community | ${APP_NAME}`, robots: { index: false } };

export default async function NewCommunityPage() {
    const me = await serverApi<UserResponse>('/auth/me');

    if (me.status === 401 || me.status === 403) {
        return (
            <EmptyState
                icon={<Users />}
                title="Sign in to start a community"
                description="You need an account to start and run a community."
                action={
                    <Button asChild>
                        <Link href={`/auth/login?next=${encodeURIComponent('/communities/new')}`}>Log in</Link>
                    </Button>
                }
            />
        );
    }
    const block = me.data?.user.community_create_block;
    if (block) {
        return (
            <EmptyState
                icon={<Users />}
                title="Not just yet"
                description={block}
                action={
                    <Button asChild variant="secondary">
                        <Link href="/communities">Browse communities</Link>
                    </Button>
                }
            />
        );
    }

    return (
        <div className="mx-auto w-full max-w-content px-4 py-4">
            <h1 className="text-2xl font-extrabold">Start a community</h1>
            <p className="mb-4 mt-1 text-sm text-muted">You&apos;ll be its owner and first moderator. Add an icon and rules once it&apos;s made.</p>
            <NewCommunityForm />
        </div>
    );
}
