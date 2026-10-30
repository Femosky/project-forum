import { Fragment } from 'react';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { TrendingCommunitiesResponse, TrendingPostsResponse, TrendingTopicsResponse } from '@/types/api';
import PageBar from '@/components/layout/PageBar';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/ui/Avatar';
import JsonLd from '@/components/common/JsonLd';
import PostCard from '@/components/post/PostCard';
import { TrendingTopics } from '@/components/trending/TrendingTopics';
import { communityLabel } from '@/lib/communityName';
import NumberUtility from '@/lib/utils/NumberUtility';
import { loadAds } from '@/ads/server';
import { slotAfter, slotsBetween } from '@/ads/config';
import FeedAdSlot from '@/ads/FeedAdSlot';

export const metadata: Metadata = pageMetadata({
    title: `Trending on ${APP_NAME}`,
    description: `What people on ${APP_NAME} are talking about right now: the busiest threads, the topics everyone is posting about and the communities growing fastest.`,
    path: '/trending',
});

// What's busy right now, from snapshots the API refreshes every 10 minutes. Rendered on the server for search
// engines and no-JS readers; guests get it from the CDN cache (see proxy.ts).
const TRENDING_POSTS = 25;

export default async function TrendingPage() {
    const [posts, topics, communities, ads] = await Promise.all([
        serverApi<TrendingPostsResponse>(`/trending?type=posts&limit=${TRENDING_POSTS}`),
        serverApi<TrendingTopicsResponse>('/trending?type=topics&limit=20'),
        serverApi<TrendingCommunitiesResponse>('/trending?type=communities&limit=8'),
        // Feed ads, placed like the home feed's (after the 3rd thread, then every 8th). Like the home feed it's no
        // community's page, so only ads that run everywhere show.
        loadAds('feed', {}, slotsBetween(0, TRENDING_POSTS, 'feed')),
    ]);
    const postList = posts.data?.posts ?? [];
    const topicList = topics.data?.topics ?? [];
    const communityList = communities.data?.communities ?? [];

    return (
        <>
            <PageBar title="Trending" />
            <div className="mx-auto grid w-full max-w-[45rem] grid-cols-1 content-start gap-x-12 sm:px-5 xl:max-w-[67rem] xl:grid-cols-[minmax(0,45rem)_16rem]">
                <JsonLd data={breadcrumbJsonLd([{ name: APP_NAME, path: '/' }, { name: 'Trending', path: '/trending' }])} />
                <div className="flex min-w-0 flex-col">
                    <header className="flex flex-col gap-3 border-b border-border px-4 py-5 sm:px-0">
                        <h1 className="text-[22px] font-semibold leading-[29px]">Trending now</h1>
                        {topicList.length > 0 ? (
                            <TrendingTopics topics={topicList} />
                        ) : (
                            <p className="text-sm text-muted">The threads people are voting on and replying to most in the last two days.</p>
                        )}
                    </header>

                    {postList.length === 0 ? (
                        <EmptyState
                            icon={<Flame />}
                            title="Nothing is trending yet"
                            description="Threads show up here once several people start voting on and replying to them."
                        />
                    ) : (
                        <div className="flex flex-col divide-y divide-border">
                            {postList.map((post, index) => {
                                const slot = slotAfter(index, 'feed');
                                return (
                                    <Fragment key={post.id}>
                                        <PostCard post={post} />
                                        {slot !== null && <FeedAdSlot unit={ads[slot]} />}
                                    </Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>

                {communityList.length > 0 && (
                    <aside
                        aria-labelledby="rising"
                        className="flex flex-col gap-3 border-t border-border px-4 py-5 sm:px-0 xl:sticky xl:top-[calc(var(--spacing-header)+3rem)] xl:max-h-[calc(100dvh-var(--spacing-header)-3rem)] xl:self-start xl:overflow-y-auto xl:border-0"
                    >
                        <h2 id="rising" className="text-xs font-semibold uppercase tracking-[0.04em] text-subtle">
                            Rising communities
                        </h2>
                        <ul className="flex flex-col gap-3">
                            {communityList.map((community) => (
                                <li key={community.id}>
                                    <Link href={`/c/${community.name}`} className="group flex items-center gap-2.5">
                                        <Avatar name={community.name} src={community.image_url} shape="square" size="sm" />
                                        <span className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm font-medium group-hover:underline">{communityLabel(community)}</span>
                                            <span className="text-xs text-subtle">
                                                {community.trending.new_members > 0
                                                    ? `+${NumberUtility.compactFormatter.format(community.trending.new_members)} members this week`
                                                    : `${NumberUtility.compactFormatter.format(community.trending.posts + community.trending.comments)} posts and replies this week`}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </aside>
                )}
            </div>
        </>
    );
}
