import Link from 'next/link';
import { PostPreviewOptions } from './PostPreviewOptions';
import { PostActions } from './PostActions';

export function PostPreview({ post }: { post: unknown }) {
    const buttonZIndex = 'z-10';
    return (
        <div className="borderborder-blue-500 w-(--main-page-width) block relative">
            <Link
                href={`/community/${post.community_ref.name}/replies/${post.short_id}`}
                className="absolute inset-0 border-b border-gray-200 hover:border-green-400 transition-transform duration-300 ease-in-out"
            />

            <div className="rounded-sm flex flex-col gap-3 py-1 px-2">
                {/* Quick links */}
                <TopSection buttonZIndex={buttonZIndex} communityName={post.community_ref.name} />

                {/* Text area */}
                <ContentSection title={post.title} content={post.content} />

                {/* Quick actions */}
                <PostActions
                    buttonZIndex={buttonZIndex}
                    upvotes={post._count.upvoters}
                    downvotes={post._count.downvoters}
                    commentsCount={post._count.comments}
                />
            </div>
            {/* </Link> */}
        </div>
    );
}

function TopSection({ buttonZIndex, communityName }: { buttonZIndex: string; communityName: string }) {
    return (
        <div className="flex justify-between items-center">
            <Link href={`/community/${communityName}`} className={buttonZIndex}>
                <span className="text-sm font-light hover:underline underline-offset-2 decoration-green-400 transition-colors">
                    the <span className="font-medium italic">{communityName}</span> community
                </span>
            </Link>

            <PostPreviewOptions buttonZIndex={buttonZIndex} />
        </div>
    );
}

function ContentSection({ title, content }: { title: string; content: string }) {
    return (
        <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-center">{title}</h3>
            <p className="text-ellipsis text-center">{content}</p>
        </div>
    );
}
