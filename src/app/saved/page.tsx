import Link from 'next/link';
import { Bookmark, ChevronRight, CloudOff } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { PostsResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import PostCard from '@/components/post/PostCard';

export const metadata = { title: `Saved | ${APP_NAME}`, robots: { index: false } };

type PageProps = { searchParams: Promise<{ cursor?: string }> };

export default async function SavedPage({ searchParams }: PageProps) {
    const { cursor } = await searchParams;
    const { data, status } = await serverApi<PostsResponse>(`/users/me/saved?type=posts${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);

    if (status === 401) {
        return (
            <EmptyState
                icon={<Bookmark />}
                title="Sign in to see saved posts"
                description="Save posts to read later; they'll show up here."
                action={
                    <Button asChild>
                        <Link href="/auth/login?next=/saved">Log in</Link>
                    </Button>
                }
            />
        );
    }

    if (!data) {
        return <EmptyState icon={<CloudOff />} title="Couldn't load saved posts" description="Try again in a moment." />;
    }

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 py-3 sm:px-4 sm:py-4">
            <h1 className="px-4 text-2xl font-extrabold sm:px-0">Saved</h1>
            {data.posts.length === 0 ? (
                <EmptyState
                    icon={<Bookmark />}
                    title="Nothing saved yet"
                    description="Tap the ••• menu on any post and choose Save to keep it here."
                />
            ) : (
                <div className="flex flex-col divide-y divide-border sm:gap-3 sm:divide-y-0">
                    {data.posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
            {data.next_cursor && (
                <div className="flex justify-center pb-6">
                    <Button asChild variant="secondary">
                        <Link href={`/saved?cursor=${encodeURIComponent(data.next_cursor)}`} rel="next">
                            Next page <ChevronRight className="size-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
