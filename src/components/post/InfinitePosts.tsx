'use client';

import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { Post, PostsResponse } from '@/types/api';
import PostCard from './PostCard';
import { PostCardSkeleton } from './PostSkeletons';
import FeedAdSlot from '@/ads/FeedAdSlot';
import { AD_SEEN_COOKIE, slotAfter, slotsBetween } from '@/ads/config';
import { readSeen } from '@/ads/frequency';
import type { AdUnit, AdsResponse } from '@/ads/types';
import { useDataSaver } from '@/lib/useDataSaver';

// The API's default page size; later pages ask for ads to cover a full page
const PAGE_SIZE = 25;

// Ads for the slots in the next page; a failed ad request just means no ads there
async function fetchAds(community: string | undefined, count: number): Promise<AdUnit[]> {
    if (count <= 0) return [];
    const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${AD_SEEN_COOKIE}=`));
    const seen = readSeen(cookie ? decodeURIComponent(cookie.slice(AD_SEEN_COOKIE.length + 1)) : undefined);
    const query = new URLSearchParams({ placement: 'feed', count: String(count), ...(community ? { community } : {}), ...(seen ? { seen } : {}) });
    try {
        return (await api<AdsResponse>(`/ads?${query}`)).ads;
    } catch {
        return [];
    }
}

type Item = { post: Post; ad?: AdUnit };

type InfinitePostsProps = {
    // API path for this list without a cursor, e.g. "/feed?sort=hot"
    apiPath: string;
    initialCursor: string;
    // Server-rendered link to the next page: what crawlers and no-JS browsers follow
    nextHref: string;
    seenIds: string[];
    showCommunity: boolean;
    // Set when this list carries ads
    ads?: { community?: string };
};

const subscribeNothing = () => () => {};

// Loads the next page as the reader nears the end of the list. Until it hydrates, it's a plain "Next page" link.
export function InfinitePosts({ apiPath, initialCursor, nextHref, seenIds, showCommunity, ads }: InfinitePostsProps) {
    // false in the server render and during hydration, true afterwards
    const isHydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
    const [items, setItems] = useState<Item[]>([]);
    const dataSaver = useDataSaver();
    const [cursor, setCursor] = useState<string | null>(initialCursor);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sentinel = useRef<HTMLDivElement>(null);
    const seen = useRef(new Set(seenIds));

    async function loadMore() {
        if (!cursor || isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const separator = apiPath.includes('?') ? '&' : '?';
            // Slots continue the server-rendered page's pattern, so count from the posts already shown
            const offset = seen.current.size;
            const [data, units] = await Promise.all([
                api<PostsResponse>(`${apiPath}${separator}cursor=${encodeURIComponent(cursor)}`),
                ads ? fetchAds(ads.community, slotsBetween(offset, PAGE_SIZE, 'feed')) : [],
            ]);
            // Hot rankings shift while you read, so a post can turn up twice
            const fresh = data.posts.filter((post) => !seen.current.has(post.id));
            fresh.forEach((post) => seen.current.add(post.id));
            const usable = dataSaver ? units.filter((unit) => unit.kind !== 'adsense') : units;
            let slots = 0;
            const batch = fresh.map((post, index): Item => {
                const slot = slotAfter(offset + index, 'feed');
                return { post, ad: slot === null ? undefined : usable[slots++] };
            });
            setItems((current) => [...current, ...batch]);
            setCursor(data.next_cursor);
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const element = sentinel.current;
        if (!isHydrated || !element || !cursor || error) return;
        const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), { rootMargin: '600px' });
        observer.observe(element);
        return () => observer.disconnect();
        // loadMore reads the latest state; re-observe when the cursor moves on
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHydrated, cursor, error]);

    if (!isHydrated) {
        return (
            <div className="flex justify-center py-6">
                <Button asChild variant="secondary">
                    <Link href={nextHref} rel="next">
                        Next page <ChevronRight className="size-4" />
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            {items.length > 0 && (
                <div className="flex flex-col divide-y divide-border border-t border-border">
                    {items.map(({ post, ad }) => (
                        <Fragment key={post.id}>
                            <PostCard post={post} showCommunity={showCommunity} />
                            <FeedAdSlot unit={ad} />
                        </Fragment>
                    ))}
                </div>
            )}
            <div ref={sentinel} className="flex flex-col items-center gap-3 py-6">
                {isLoading && <PostCardSkeleton className="w-full" />}
                {error && (
                    <>
                        <ErrorMessage size="small" errorMessage={error} role="alert" />
                        <Button variant="secondary" onClick={loadMore}>
                            Try again
                        </Button>
                    </>
                )}
                {!cursor && <p className="text-sm text-muted">You&apos;re all caught up.</p>}
            </div>
        </>
    );
}

export default InfinitePosts;
