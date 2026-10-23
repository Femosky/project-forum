import { HeaderSkeleton, PostListSkeleton, TabsSkeleton } from '@/components/post/PostSkeletons';

export default function Loading() {
    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 sm:px-4 sm:py-4">
            <HeaderSkeleton />
            <TabsSkeleton />
            <PostListSkeleton count={3} />
        </div>
    );
}
