import { twMerge } from 'tailwind-merge';
import Skeleton from '@/components/ui/Skeleton';

// Placeholders shaped like the real content, shown while a page or the next batch loads

export function PostCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={twMerge('flex flex-col gap-3 bg-surface px-4 py-3 sm:rounded-xl sm:border sm:border-border', className)}>
            <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-14 rounded-full" />
            </div>
        </div>
    );
}

export function PostListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="flex flex-col divide-y divide-border sm:gap-3 sm:divide-y-0" role="status" aria-label="Loading">
            {Array.from({ length: count }, (_, i) => (
                <PostCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function CommentSkeleton() {
    return (
        <div className="flex gap-2.5">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/5" />
            </div>
        </div>
    );
}

// Header block for community and profile pages
export function HeaderSkeleton() {
    return (
        <div className="flex items-center gap-4 border-b border-border bg-surface px-4 py-5 sm:rounded-xl sm:border">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-56" />
            </div>
        </div>
    );
}

export function TabsSkeleton() {
    return (
        <div className="flex gap-2 px-4 sm:px-0">
            <Skeleton className="h-8 w-14 rounded-full" />
            <Skeleton className="h-8 w-14 rounded-full" />
            <Skeleton className="h-8 w-14 rounded-full" />
        </div>
    );
}
