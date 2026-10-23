import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CloudOff, Lock, Plus } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { CommunityResponse, FlairsResponse, PostsResponse } from '@/types/api';
import CommunityHeader from '@/components/community/CommunityHeader';
import ManageFlairs from '@/components/community/ManageFlairs';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { PostList, SortTabs, parsePostSort } from '@/components/post/PostList';
import JsonLd from '@/components/common/JsonLd';
import { breadcrumbJsonLd, communityDescription, noindexMetadata, pageMetadata } from '@/lib/seo';

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
    const [community, posts] = await Promise.all([
        serverApi<CommunityResponse>(`/communities/${encodeURIComponent(name)}`),
        serverApi<PostsResponse>(`${postsPath}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
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
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 sm:px-4 sm:py-4">
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: APP_NAME, path: '/' },
                    { name: `c/${community.data.community.name}`, path: `/c/${community.data.community.name}` },
                ])}
            />
            <CommunityHeader community={community.data.community} viewer={community.data.viewer} />
            {isModerator && <ManageFlairs community={community.data.community.name} initialFlairs={flairs?.data?.flairs ?? []} />}

            {isPrivateAndClosed ? (
                <EmptyState
                    icon={<Lock />}
                    title="This community is private"
                    description="Join to see its posts. A moderator will look at your request."
                />
            ) : (
                <>
                    <div className="flex items-center justify-between gap-2 pr-4 sm:pr-0">
                        <SortTabs basePath={basePath} current={sort} />
                        <Button asChild variant="secondary" size="sm">
                            <Link href={`/submit?community=${community.data.community.name}`}>
                                <Plus className="size-4" /> Post
                            </Link>
                        </Button>
                    </div>
                    <PostList
                        posts={posts.data?.posts ?? []}
                        basePath={basePath}
                        sort={sort}
                        nextCursor={posts.data?.next_cursor ?? null}
                        apiPath={postsPath}
                        showCommunity={false}
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
    );
}
