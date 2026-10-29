import Link from 'next/link';
import { CloudOff } from 'lucide-react';
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { FeedResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { PostList, SortTabs, parsePostSort } from '@/components/post/PostList';
import JsonLd from '@/components/common/JsonLd';
import PageBar from '@/components/layout/PageBar';
import ComposePrompt from '@/components/post/ComposePrompt';
import { pageMetadata, websiteJsonLd } from '@/lib/seo';
import { loadAds } from '@/ads/server';
import { slotsBetween } from '@/ads/config';
import TrendingNow from '@/components/trending/TrendingNow';

type PageProps = { searchParams: Promise<{ sort?: string; cursor?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const { sort, cursor } = await searchParams;
    return pageMetadata({ title: APP_NAME, path: '/', noindex: Boolean(sort || cursor) });
}

export default async function Home({ searchParams }: PageProps) {
    const { sort: sortParam, cursor } = await searchParams;
    const sort = parsePostSort(sortParam);
    const listQuery = new URLSearchParams({ sort, ...(sort === 'top' ? { t: 'week' } : {}) });
    const [{ data }, ads, trending] = await Promise.all([
        serverApi<FeedResponse>(`/feed?${listQuery}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
        loadAds('feed', {}, slotsBetween(0, 25, 'feed')),
        // The first page only; rendered with the page, shown in a right rail on wide screens
        cursor ? null : TrendingNow(),
    ]);

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
        <>
            <PageBar title="Home" actions={<SortTabs basePath="/" current={sort} />} />
            <div className="mx-auto grid w-full max-w-[45rem] grid-cols-1 content-start gap-x-12 pb-8 sm:px-5 xl:max-w-[67rem] xl:grid-cols-[minmax(0,45rem)_16rem]">
            <div className="flex min-w-0 flex-col">
                <JsonLd data={websiteJsonLd()} />
                <ComposePrompt />
                <PostList
                    posts={data.posts}
                    basePath="/"
                    sort={sort}
                    nextCursor={data.next_cursor}
                    apiPath={`/feed?${listQuery}`}
                    ads={{ units: ads }}
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
            {/* Wide screens only: on phones the feed comes first and Trending has its own tab */}
            {trending && <div className="hidden xl:block">{trending}</div>}
            </div>
        </>
    );
}
