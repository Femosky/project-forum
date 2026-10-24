import { twMerge } from 'tailwind-merge';
import Skeleton from '@/components/ui/Skeleton';

// Placeholders shaped like the real content, shown while the next batch of posts or comments loads.
// Pages have no loading.tsx on purpose: streaming a skeleton first puts the real content in a hidden <div> that
// only JavaScript reveals, so readers with JS off (and crawlers) would see a skeleton forever.

export function PostCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={twMerge('flex flex-col gap-3 px-4 py-3', className)}>
            <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-14 rounded-lg" />
            </div>
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
