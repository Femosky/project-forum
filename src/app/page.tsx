import Link from 'next/link';
import { CloudOff } from 'lucide-react';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { FeedResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { PostList, SortTabs, parsePostSort } from '@/components/post/PostList';

export const metadata = {
    title: `Home | ${APP_NAME}`,
    description: APP_DESCRIPTION,
};

type PageProps = { searchParams: Promise<{ sort?: string; cursor?: string }> };

export default async function Home({ searchParams }: PageProps) {
    const { sort: sortParam, cursor } = await searchParams;
    const sort = parsePostSort(sortParam);
    const listQuery = new URLSearchParams({ sort, ...(sort === 'top' ? { t: 'week' } : {}) });
    const { data } = await serverApi<FeedResponse>(`/feed?${listQuery}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);

    if (!data) {
        return (
            <EmptyState
                icon={<CloudOff />}
                title="Couldn't load posts"
                description="Something went wrong on our side. Try again in a moment."
            />
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 py-3 sm:px-4 sm:py-4">
            <SortTabs basePath="/" current={sort} />
            <PostList
                posts={data.posts}
                basePath="/"
                sort={sort}
                nextCursor={data.next_cursor}
                apiPath={`/feed?${listQuery}`}
                empty={{
                    title: cursor ? "That's everything" : 'No posts yet',
                    description: cursor ? "You've reached the end of the feed." : 'Be the first to start a conversation.',
                    action: (
                        <Button asChild>
                            <Link href={cursor ? '/' : '/submit'}>{cursor ? 'Back to the top' : 'Create a post'}</Link>
                        </Button>
                    ),
                }}
            />
        </div>
    );
}
