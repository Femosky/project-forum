'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { Post, PostsResponse } from '@/types/api';
import PostCard from './PostCard';
import { PostCardSkeleton } from './PostSkeletons';

type InfinitePostsProps = {
    // API path for this list without a cursor, e.g. "/feed?sort=hot"
    apiPath: string;
    initialCursor: string;
    // Server-rendered link to the next page: what crawlers and no-JS browsers follow
    nextHref: string;
    seenIds: string[];
    showCommunity: boolean;
};

// Loads the next page as the reader nears the end of the list. Until it hydrates, it's a plain "Next page" link.
export function InfinitePosts({ apiPath, initialCursor, nextHref, seenIds, showCommunity }: InfinitePostsProps) {
    const [isHydrated, setIsHydrated] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [cursor, setCursor] = useState<string | null>(initialCursor);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sentinel = useRef<HTMLDivElement>(null);
    const seen = useRef(new Set(seenIds));

    useEffect(() => setIsHydrated(true), []);

    async function loadMore() {
        if (!cursor || isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const separator = apiPath.includes('?') ? '&' : '?';
            const data = await api<PostsResponse>(`${apiPath}${separator}cursor=${encodeURIComponent(cursor)}`);
            // Hot rankings shift while you read, so a post can turn up twice
            const fresh = data.posts.filter((post) => !seen.current.has(post.id));
            fresh.forEach((post) => seen.current.add(post.id));
            setPosts((current) => [...current, ...fresh]);
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
            <div className="flex justify-center pb-6">
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
            {posts.length > 0 && (
                <div className="flex flex-col divide-y divide-border border-t border-border sm:gap-3 sm:divide-y-0 sm:border-t-0">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} showCommunity={showCommunity} />
                    ))}
                </div>
            )}
            <div ref={sentinel} className="flex flex-col items-center gap-3 pb-6">
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
