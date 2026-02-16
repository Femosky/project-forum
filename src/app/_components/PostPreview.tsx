import Button from '@/components/ui/Button';
import Link from 'next/link';

import NumberUtility from '@/lib/utils/NumberUtility';
import { MessageCircle, Share, Triangle } from 'lucide-react';
import { PostPreviewOptions } from './PostPreviewOptions';

export function PostPreview({ post }: { post: unknown }) {
    const buttonZIndex = 'z-10';
    return (
        <div className="borderborder-blue-500 w-6/9 block relative">
            <Link
                href={'add later'}
                className="absolute inset-0 border-b border-gray-200 hover:border-green-400 transition-transform duration-300 ease-in-out"
            />

            <div className="rounded-sm flex flex-col gap-3 py-1 px-2">
                {/* Quick links */}
                <TopSection buttonZIndex={buttonZIndex} communityName={post.community_ref.name} />

                {/* Text area */}
                <TextSection title={post.title} content={post.content} />

                {/* Quick actions */}
                <QuickActionsSection
                    buttonZIndex={buttonZIndex}
                    upvotes={post._count.upvoters}
                    downvotes={post._count.downvoters}
                    comments={post._count.comments}
                />
            </div>
            {/* </Link> */}
        </div>
    );
}

function TopSection({ buttonZIndex, communityName }: { buttonZIndex: string; communityName: string }) {
    return (
        <div className="flex justify-between items-center">
            <Link href={'/add later 2'} className={buttonZIndex}>
                <span className="text-sm font-light hover:underline underline-offset-2 decoration-green-400 transition-colors">
                    the <span className="font-medium italic">{communityName}</span> community
                </span>
            </Link>

            <PostPreviewOptions buttonZIndex={buttonZIndex} />
        </div>
    );
}

function TextSection({ title, content }: { title: string; content: string }) {
    return (
        <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-center">{title}</h3>
            <p className="text-ellipsis text-center">{content}</p>
        </div>
    );
}

function QuickActionsSection({
    buttonZIndex,
    upvotes,
    downvotes,
    comments,
}: {
    buttonZIndex: string;
    upvotes: number;
    downvotes: number;
    comments: number;
}) {
    return (
        <div className="flex items-start justify-between text-sm text-gray-700">
            <Button className="invisible" size="round" variant="transparent" disabled={true}>
                <Share className="size-5" />
            </Button>

            <div className="flex self-center gap-1.5">
                <div className="flex flex-col items-center justify-center gap-0">
                    <Button size="round" variant="transparent" className={buttonZIndex}>
                        <Triangle className="size-5" />
                    </Button>
                    <span className="-mt-1.5">{NumberUtility.compactFormatter.format(upvotes)}</span>
                </div>

                <div className="flex flex-col items-center justify-center gap-0">
                    <Button size="round" variant="transparent" className={buttonZIndex}>
                        <Triangle className="size-5 rotate-180" />
                    </Button>
                    <span className="-mt-1.5">{NumberUtility.compactFormatter.format(downvotes)}</span>
                </div>

                <div className="flex flex-col items-center justify-center gap-0">
                    <Button size="round" variant="transparent" className={buttonZIndex}>
                        <MessageCircle className="size-5" />
                    </Button>
                    <span className="-mt-1.5">{NumberUtility.compactFormatter.format(comments)}</span>
                </div>
            </div>

            <Button size="round" variant="transparent" className={buttonZIndex}>
                <Share className="size-5" />
            </Button>
        </div>
    );
}
