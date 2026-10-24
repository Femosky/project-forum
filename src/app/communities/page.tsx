import type { Metadata } from 'next';
import Link from 'next/link';
import { CloudOff, Search, Users } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { APP_NAME } from '@/lib/constants';
import { pageMetadata } from '@/lib/seo';
import { serverApi } from '@/lib/api/server';
import { categoryLabel } from '@/lib/moderation';
import { CategoriesResponse, CommunitiesResponse } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import InputField from '@/components/ui/Input';
import NumberUtility from '@/lib/utils/NumberUtility';

type PageProps = { searchParams: Promise<{ category?: string; q?: string; sort?: string; cursor?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const { category, q, sort, cursor } = await searchParams;
    const label = categoryLabel(category ?? null);
    return pageMetadata({
        title: label ? `${label} communities | ${APP_NAME}` : `Communities | ${APP_NAME}`,
        description: label
            ? `Communities about ${label.toLowerCase()} on ${APP_NAME}.`
            : `Browse every community on ${APP_NAME} by topic, from the biggest to the newest.`,
        path: label ? `/communities?category=${category}` : '/communities',
        // Category pages are worth indexing; searches, sorts and later pages are not
        noindex: Boolean(q || sort || cursor),
    });
}

const chipClasses = 'flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-sm font-semibold transition-colors';

// The directory: category chips and a name search, all plain links and a GET form so it works without scripts
export default async function CommunitiesPage({ searchParams }: PageProps) {
    const { category, q, sort: sortParam, cursor } = await searchParams;
    const sort = sortParam === 'new' ? 'new' : 'popular';
    const query = new URLSearchParams({
        sort,
        limit: '50',
        ...(category ? { category } : {}),
        ...(q?.trim() ? { q: q.trim().slice(0, 50) } : {}),
        ...(cursor ? { cursor } : {}),
    });
    const [list, categories] = await Promise.all([
        serverApi<CommunitiesResponse>(`/communities?${query}`),
        serverApi<CategoriesResponse>('/communities/categories'),
    ]);

    const linkTo = (params: Record<string, string | undefined>) => {
        const next = new URLSearchParams(Object.entries({ category, q, ...params }).filter(([, value]) => value) as [string, string][]);
        return `/communities${next.size ? `?${next}` : ''}`;
    };
    const activeLabel = categoryLabel(category ?? null);

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 py-3 sm:px-4 sm:py-4">
            <h1 className="px-4 text-2xl font-extrabold sm:px-0">{activeLabel ? `${activeLabel} communities` : 'Communities'}</h1>

            <form action="/communities" method="get" role="search" className="flex gap-2 px-4 sm:px-0">
                {category && <input type="hidden" name="category" value={category} />}
                <InputField
                    type="search"
                    name="q"
                    variant="search"
                    aria-label="Search communities"
                    placeholder="Search communities"
                    defaultValue={q ?? ''}
                    maxLength={50}
                />
                <Button type="submit" variant="secondary" aria-label="Search">
                    <Search className="size-4" />
                </Button>
            </form>

            <nav aria-label="Categories" className="flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap sm:px-0">
                <Link
                    href={linkTo({ category: undefined })}
                    aria-current={!category ? 'page' : undefined}
                    className={twMerge(chipClasses, !category ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong hover:bg-surface-muted')}
                >
                    All
                </Link>
                {(categories.data?.categories ?? [])
                    .filter((option) => option.count > 0 || option.id === category)
                    .map((option) => (
                        <Link
                            key={option.id}
                            href={linkTo({ category: option.id })}
                            aria-current={category === option.id ? 'page' : undefined}
                            className={twMerge(
                                chipClasses,
                                category === option.id ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong hover:bg-surface-muted'
                            )}
                        >
                            {option.label} <span className="font-normal opacity-70 tabular-nums">{option.count}</span>
                        </Link>
                    ))}
            </nav>

            <div className="flex gap-3 px-4 text-sm sm:px-0">
                {(['popular', 'new'] as const).map((option) => (
                    <Link
                        key={option}
                        href={linkTo({ sort: option === 'popular' ? undefined : option })}
                        aria-current={sort === option ? 'page' : undefined}
                        className={twMerge('font-semibold', sort === option ? 'text-text underline underline-offset-4' : 'text-muted hover:text-text')}
                    >
                        {option === 'popular' ? 'Most members' : 'Newest'}
                    </Link>
                ))}
            </div>

            {!list.data ? (
                <EmptyState icon={<CloudOff />} title="Couldn't load communities" description="Try again in a moment." />
            ) : list.data.communities.length === 0 ? (
                <EmptyState
                    icon={<Users />}
                    title={q ? `No communities match "${q}"` : 'No communities here yet'}
                    description={q || category ? 'Try another search or category.' : undefined}
                />
            ) : (
                <>
                    <ul className="flex flex-col divide-y divide-border bg-surface sm:rounded-xl sm:border sm:border-border">
                        {list.data.communities.map((community) => (
                            <li key={community.id}>
                                <Link
                                    href={`/c/${community.name}`}
                                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60"
                                >
                                    <Avatar name={community.name} src={community.image_url} size="lg" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-bold">{community.display_name || community.name}</p>
                                        {community.description && <p className="line-clamp-1 text-sm text-muted">{community.description}</p>}
                                        {!category && categoryLabel(community.category) && (
                                            <p className="text-xs text-muted">{categoryLabel(community.category)}</p>
                                        )}
                                    </div>
                                    <span className="shrink-0 text-xs text-muted">
                                        <span className="tabular-nums">{NumberUtility.compactFormatter.format(community.member_count)}</span>{' '}
                                        {community.member_count === 1 ? 'member' : 'members'}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {list.data.next_cursor && (
                        <Button asChild variant="secondary" className="self-center">
                            <Link href={linkTo({ sort: sort === 'popular' ? undefined : sort, cursor: list.data.next_cursor })}>Next page</Link>
                        </Button>
                    )}
                </>
            )}
        </div>
    );
}
