import { PostListSkeleton, TabsSkeleton } from '@/components/post/PostSkeletons';

// Shown while any page without its own loading state fetches on the server
export default function Loading() {
    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 py-3 sm:px-4 sm:py-4">
            <TabsSkeleton />
            <PostListSkeleton />
        </div>
    );
}
