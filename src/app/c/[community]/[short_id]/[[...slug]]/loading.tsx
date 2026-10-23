import Skeleton from '@/components/ui/Skeleton';
import { CommentSkeleton } from '@/components/post/PostSkeletons';

export default function Loading() {
    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-4 px-4 py-3 sm:py-4" role="status" aria-label="Loading">
            <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-7 w-11/12" />
            <Skeleton className="h-7 w-2/3" />
            <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-11 w-full rounded-full" />
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
        </div>
    );
}
