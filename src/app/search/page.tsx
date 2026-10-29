import Link from 'next/link';
import { ChevronRight, CloudOff, SearchIcon, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { Community, SearchCommentsResponse, SearchCommunitiesResponse, SearchPostsResponse } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import PostCard from '@/components/post/PostCard';
import NumberUtility from '@/lib/utils/NumberUtility';
import { communityLabel } from '@/lib/communityName';
import CommentListItem from '@/components/post/CommentListItem';
import SearchBox from '@/components/common/SearchBox';

type SearchPageProps = {
    searchParams: Promise<{ q?: string; type?: string; page?: string; community?: string }>;
};

const TYPES = ['posts', 'comments', 'communities'] as const;
type SearchType = (typeof TYPES)[number];

export async function generateMetadata({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    return { title: q ? `${q} - Search | ${APP_NAME}` : `Search | ${APP_NAME}`, robots: { index: false } };
}

function searchHref(q: string, type: SearchType, options: { page?: number; community?: string | null } = {}) {
    return `/search?${new URLSearchParams({
        q,
        ...(type !== 'posts' ? { type } : {}),
        ...(options.community && type !== 'communities' ? { community: options.community } : {}),
        ...(options.page && options.page > 1 ? { page: String(options.page) } : {}),
    })}`;
}

function CommunityList({ communities }: { communities: Community[] }) {
    return (
        <ul className="flex flex-col divide-y divide-border bg-surface sm:rounded-xl sm:border sm:border-border">
            {communities.map((community) => (
                <li key={community.id}>
                    <Link href={`/c/${community.name}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60">
                        <Avatar name={community.name} src={community.image_url} size="lg" shape="square" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-bold">{communityLabel(community)}</p>
                            {community.description && <p className="line-clamp-1 text-sm text-muted">{community.description}</p>}
                        </div>
                        <span className="shrink-0 text-xs text-muted">
                            <span className="tabular-nums">{NumberUtility.compactFormatter.format(community.member_count)}</span>{' '}
                            {community.member_count === 1 ? 'member' : 'members'}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

// A plain GET form, so search works without JavaScript and results have shareable URLs
export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q: rawQuery, type: rawType, page: rawPage, community: rawCommunity } = await searchParams;
    const q = (rawQuery ?? '').trim();
    const type: SearchType = TYPES.includes(rawType as SearchType) ? (rawType as SearchType) : 'posts';
    const page = Math.max(1, Number(rawPage) || 1);
    const community = /^[a-z][a-z0-9_]{2,20}$/i.test(rawCommunity ?? '') ? rawCommunity!.toLowerCase() : null;
    const canSearch = q.length >= 2;

    const query = new URLSearchParams({ q, type, page: String(page), ...(community && type !== 'communities' ? { community } : {}) });
    const result = canSearch
        ? await serverApi<SearchPostsResponse | SearchCommentsResponse | SearchCommunitiesResponse>(`/search?${query}`)
        : null;
    const data = result?.data ?? null;
    const items = data ? ('posts' in data ? data.posts : 'comments' in data ? data.comments : data.communities) : [];
    const nextPage = data?.next_page ?? null;
    const suggestion = data?.did_you_mean ?? null;
    const related = data?.related_communities ?? [];
    const scope = community ? ` in ${communityLabel({ name: community })}` : '';

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 py-3 sm:px-4 sm:py-4">
            <div className="px-4 sm:px-0">
                <SearchBox
                    defaultValue={q}
                    autoFocus={!q}
                    placeholder={community ? `Search in ${communityLabel({ name: community })}` : `Search ${APP_NAME}`}
                    hidden={{ ...(type !== 'posts' ? { type } : {}), ...(community && type !== 'communities' ? { community } : {}) }}
                />
            </div>

            {q && (
                <nav aria-label="Search in" className="flex flex-wrap items-center gap-1 px-4 sm:px-0">
                    {TYPES.map((value) => (
                        <Link
                            key={value}
                            href={searchHref(q, value, { community })}
                            aria-current={type === value ? 'page' : undefined}
                            className={twMerge(
                                'flex h-8 items-center rounded-full px-3 text-sm font-semibold capitalize transition-colors',
                                type === value ? 'bg-highlight text-highlight-fg' : 'text-muted hover:bg-surface-muted hover:text-text'
                            )}
                        >
                            {value}
                        </Link>
                    ))}
                    {community && type !== 'communities' && (
                        <Link
                            href={searchHref(q, type)}
                            className="ml-auto flex h-8 items-center gap-1 rounded-full px-3 text-sm text-muted ring-1 ring-inset ring-border-strong hover:bg-hover hover:text-text"
                            aria-label={`Search everywhere instead of only ${communityLabel({ name: community })}`}
                        >
                            In {communityLabel({ name: community })} <X className="size-3.5" />
                        </Link>
                    )}
                </nav>
            )}

            {suggestion && (
                <p className="px-4 text-sm text-muted sm:px-0">
                    Did you mean{' '}
                    <Link href={searchHref(suggestion, type, { community })} className="font-semibold text-link hover:underline">
                        {suggestion}
                    </Link>
                    ?
                </p>
            )}

            {!q ? (
                <EmptyState
                    icon={<SearchIcon />}
                    title="Search posts, replies and communities"
                    description='Use "quotes" for an exact phrase and -word to leave a word out.'
                />
            ) : !canSearch ? (
                <EmptyState icon={<SearchIcon />} title="Keep typing" description="Search needs at least 2 characters." />
            ) : !data ? (
                <EmptyState icon={<CloudOff />} title="Search isn't working right now" description="Try again in a moment." />
            ) : items.length === 0 ? (
                <EmptyState
                    icon={<SearchIcon />}
                    title={page > 1 ? 'No more results' : `No ${type} match "${q}"${scope}`}
                    description={community ? 'Try fewer words, or search everywhere.' : 'Try fewer or different words.'}
                />
            ) : 'posts' in data ? (
                <div className="flex flex-col divide-y divide-border sm:gap-3 sm:divide-y-0">
                    {data.posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : 'comments' in data ? (
                <div className="flex flex-col divide-y divide-border">
                    {data.comments.map((comment) => (
                        <CommentListItem key={comment.id} comment={comment} />
                    ))}
                </div>
            ) : (
                <CommunityList communities={data.communities} />
            )}

            {related.length > 0 && (
                <section aria-labelledby="similar-communities" className="flex flex-col gap-2 pt-2">
                    <h2 id="similar-communities" className="px-4 text-xs font-semibold uppercase tracking-[0.04em] text-subtle sm:px-0">
                        Communities with a similar name
                    </h2>
                    <CommunityList communities={related} />
                </section>
            )}

            {nextPage && (
                <div className="flex justify-center pb-6">
                    <Button asChild variant="secondary">
                        <Link href={searchHref(q, type, { page: nextPage, community })} rel="next">
                            Next page <ChevronRight className="size-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
