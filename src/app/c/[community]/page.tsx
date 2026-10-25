import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CloudOff, Lock, Plus } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { CommunityResponse, FlairsResponse, PostsResponse } from '@/types/api';
import CommunityHeader from '@/components/community/CommunityHeader';
import ManageFlairs from '@/components/community/ManageFlairs';
import CommunityRail from '@/components/community/CommunityRail';
import EmptyState from '@/components/ui/EmptyState';
import { PostList, SortTabs, parsePostSort } from '@/components/post/PostList';
import JsonLd from '@/components/common/JsonLd';
import PageBar from '@/components/layout/PageBar';
import Avatar from '@/components/ui/Avatar';
import { breadcrumbJsonLd, communityDescription, noindexMetadata, pageMetadata } from '@/lib/seo';
import { loadAds } from '@/ads/server';
import { slotsBetween } from '@/ads/config';
import { communityLabel } from '@/lib/communityName';

type PageProps = {
    params: Promise<{ community: string }>;
    searchParams: Promise<{ sort?: string; cursor?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
    const { community: name } = await params;
    const { sort, cursor } = await searchParams;
    const { data } = await serverApi<CommunityResponse>(`/communities/${encodeURIComponent(name)}`);
    if (!data) return noindexMetadata(`Community not found | ${APP_NAME}`);

    const { community } = data;
    const heading = community.display_name ? `${community.display_name} (c/${community.name})` : `c/${community.name}`;
    return pageMetadata({
        title: `${heading} | ${APP_NAME}`,
        description: communityDescription(community),
        path: `/c/${community.name}`,
        image: `/og/c/${community.name}`,
        // Sorted and later pages are for people; crawlers follow their links but index the community once
        noindex: community.visibility === 'private' || Boolean(sort || cursor),
    });
}

export default async function CommunityPage({ params, searchParams }: PageProps) {
    const { community: name } = await params;
    const { sort: sortParam, cursor } = await searchParams;
    const sort = parsePostSort(sortParam);
    const basePath = `/c/${name}`;

    const listQuery = new URLSearchParams({ sort, ...(sort === 'top' ? { t: 'all' } : {}) });
    const postsPath = `/communities/${encodeURIComponent(name)}/posts?${listQuery}`;
    const [community, posts, ads] = await Promise.all([
        serverApi<CommunityResponse>(`/communities/${encodeURIComponent(name)}`),
        serverApi<PostsResponse>(`${postsPath}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
        // The API decides whether this community carries ads at all (NSFW, private and sensitive ones don't)
        loadAds('feed', { community: name.toLowerCase() }, slotsBetween(0, 25, 'feed')),
    ]);

    if (community.status === 404) notFound();
    if (!community.data) {
        return <EmptyState icon={<CloudOff />} title="Couldn't load this community" description="Try again in a moment." />;
    }

    const role = community.data.viewer?.role;
    const isModerator = role === 'owner' || role === 'moderator';
    const flairs = isModerator ? await serverApi<FlairsResponse>(`/communities/${encodeURIComponent(name)}/flairs`) : null;

    const isPrivateAndClosed = !posts.data && (posts.status === 403 || posts.status === 404);

    return (
        // One column on small screens (header, about and rules, posts); on wide ones the about panel moves to a right rail
        <>
        <PageBar
            title={
                <>
                    <Avatar name={community.data.community.name} src={community.data.community.image_url} shape="square" className="size-[18px] text-[10px]" />
                    <span className="truncate">{communityLabel(community.data.community)}</span>
                </>
            }
            actions={!isPrivateAndClosed && <SortTabs basePath={basePath} current={sort} />}
        />
        <div className="mx-auto grid w-full max-w-[45rem] grid-cols-1 content-start gap-x-12 sm:px-5 xl:max-w-[67rem] xl:grid-cols-[minmax(0,45rem)_16rem] xl:grid-rows-[auto_1fr]">
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: APP_NAME, path: '/' },
                    { name: `c/${community.data.community.name}`, path: `/c/${community.data.community.name}` },
                ])}
            />
            <CommunityHeader community={community.data.community} viewer={community.data.viewer} />
            <div className="border-b border-border xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:border-0 xl:pt-6">
                <CommunityRail data={community.data} />
            </div>
            <div className="flex min-w-0 flex-col xl:col-start-1">
                {isModerator && <ManageFlairs community={community.data.community.name} initialFlairs={flairs?.data?.flairs ?? []} />}

                {isPrivateAndClosed ? (
                    <EmptyState
                        icon={<Lock />}
                        title="This community is private"
                        description="Join to see its posts. A moderator will look at your request."
                    />
                ) : (
                    <>
                        <Link
                            href={`/submit?community=${community.data.community.name}`}
                            className="group flex items-center gap-3 border-b border-border px-4 py-4 text-subtle sm:px-0"
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-active text-muted">
                                <Plus className="size-4" />
                            </span>
                            <span className="flex-1 text-[15px] group-hover:text-muted">
                                Post in {communityLabel(community.data.community)}
                            </span>
                        </Link>
                        <PostList
                            posts={posts.data?.posts ?? []}
                            basePath={basePath}
                            sort={sort}
                            nextCursor={posts.data?.next_cursor ?? null}
                            apiPath={postsPath}
                            showCommunity={false}
                            ads={{ units: ads, community: community.data.community.name }}
                            empty={{
                                title: posts.data ? 'No posts here yet' : "Couldn't load posts",
                                description: posts.data
                                    ? 'Start the first conversation in this community.'
                                    : 'Something went wrong on our side. Try again in a moment.',
                            }}
                        />
                    </>
                )}
            </div>
        </div>
        </>
    );
}
