import Link from 'next/link';
import { ChevronRight, CloudOff, SearchIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { SearchCommunitiesResponse, SearchPostsResponse } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import InputField from '@/components/ui/Input';
import PostCard from '@/components/post/PostCard';
import NumberUtility from '@/lib/utils/NumberUtility';

type SearchPageProps = {
    searchParams: Promise<{ q?: string; type?: string; page?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    return { title: q ? `${q} - Search | ${APP_NAME}` : `Search | ${APP_NAME}`, robots: { index: false } };
}

function searchHref(q: string, type: 'posts' | 'communities', page?: number) {
    return `/search?${new URLSearchParams({ q, ...(type === 'communities' ? { type } : {}), ...(page && page > 1 ? { page: String(page) } : {}) })}`;
}

// A plain GET form, so search works without JavaScript and results have shareable URLs
export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q: rawQuery, type: rawType, page: rawPage } = await searchParams;
    const q = (rawQuery ?? '').trim();
    const type = rawType === 'communities' ? 'communities' : 'posts';
    const page = Math.max(1, Number(rawPage) || 1);
    const canSearch = q.length >= 2;

    const query = new URLSearchParams({ q, type, page: String(page) });
    const [posts, communities] = await Promise.all([
        canSearch && type === 'posts' ? serverApi<SearchPostsResponse>(`/search?${query}`) : null,
        canSearch && type === 'communities' ? serverApi<SearchCommunitiesResponse>(`/search?${query}`) : null,
    ]);
    const result = posts ?? communities;
    const nextPage = posts?.data?.next_page ?? communities?.data?.next_page ?? null;
    const isEmpty = (posts?.data?.posts.length ?? communities?.data?.communities.length ?? 0) === 0;

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 py-3 sm:px-4 sm:py-4">
            <form action="/search" role="search" className="relative px-4 sm:px-0">
                <SearchIcon className="pointer-events-none absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted sm:left-3.5" />
                <InputField
                    variant="search"
                    type="search"
                    name="q"
                    defaultValue={q}
                    aria-label={`Search ${APP_NAME}`}
                    placeholder={`Search ${APP_NAME}`}
                    autoFocus={!q}
                    className="pl-10"
                />
                {type === 'communities' && <input type="hidden" name="type" value="communities" />}
            </form>

            {q && (
                <nav aria-label="Search in" className="flex gap-1 px-4 sm:px-0">
                    {(['posts', 'communities'] as const).map((value) => (
                        <Link
                            key={value}
                            href={searchHref(q, value)}
                            aria-current={type === value ? 'page' : undefined}
                            className={twMerge(
                                'flex h-8 items-center rounded-full px-3 text-sm font-semibold capitalize transition-colors',
                                type === value ? 'bg-highlight text-highlight-fg' : 'text-muted hover:bg-surface-muted hover:text-text'
                            )}
                        >
                            {value}
                        </Link>
                    ))}
                </nav>
            )}

            {!q ? (
                <EmptyState
                    icon={<SearchIcon />}
                    title="Search posts and communities"
                    description='Use "quotes" for an exact phrase and -word to leave a word out.'
                />
            ) : !canSearch ? (
                <EmptyState icon={<SearchIcon />} title="Keep typing" description="Search needs at least 2 characters." />
            ) : !result?.data ? (
                <EmptyState icon={<CloudOff />} title="Search isn't working right now" description="Try again in a moment." />
            ) : isEmpty ? (
                <EmptyState
                    icon={<SearchIcon />}
                    title={page > 1 ? 'No more results' : `No ${type} match "${q}"`}
                    description="Try fewer or different words."
                />
            ) : posts?.data ? (
                <div className="flex flex-col divide-y divide-border sm:gap-3 sm:divide-y-0">
                    {posts.data.posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <ul className="flex flex-col divide-y divide-border bg-surface sm:rounded-xl sm:border sm:border-border">
                    {communities!.data!.communities.map((community) => (
                        <li key={community.id}>
                            <Link href={`/c/${community.name}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60">
                                <Avatar name={community.name} src={community.image_url} size="lg" shape="square" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-bold">{community.display_name || community.name}</p>
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
            )}

            {nextPage && (
                <div className="flex justify-center pb-6">
                    <Button asChild variant="secondary">
                        <Link href={searchHref(q, type, nextPage)} rel="next">
                            Next page <ChevronRight className="size-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
