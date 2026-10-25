'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import NumberUtility from '@/lib/utils/NumberUtility';
import { useUIStore } from '@/lib/uiStore';
import { Post } from '@/types/api';
import ContentOptionsMenu from './ContentOptionsMenu';

// The post's comment count. Follows new comments made on this page, so it updates without a refresh.
export function CommentCountButton({ post, href }: { post: Post; href: string }) {
    const count = useUIStore((state) => state.commentCounts[post.id]) ?? post.comment_count;

    return (
        <Button asChild variant="ghost" size="sm" className="relative z-10 h-7 gap-1.5 px-2 font-semibold text-subtle hover:text-text">
            <Link href={href}>
                <MessageCircle className="size-4" />
                <span className="tabular-nums">{NumberUtility.compactFormatter.format(count)}</span>
                <span className="sr-only">{count === 1 ? 'comment' : 'comments'}</span>
            </Link>
        </Button>
    );
}

// The post's "..." menu. Deleting from the post page goes back to the community; from a list it drops out.
export function PostOptions({ post, leaveOnDelete, isModerator }: { post: Post; leaveOnDelete: boolean; isModerator: boolean }) {
    const router = useRouter();
    const setEditingPost = useUIStore((state) => state.setEditingPost);

    function handleDeleted() {
        if (leaveOnDelete) router.push(`/c/${post.community.name}`);
        router.refresh();
    }

    return (
        <ContentOptionsMenu
            targetType="post"
            id={post.id}
            saved={post.viewer?.saved}
            isAuthor={post.viewer?.is_author}
            onDeleted={handleDeleted}
            // Editing happens in place on the post's own page
            onEdit={leaveOnDelete && post.viewer?.is_author ? () => setEditingPost(post.id) : undefined}
            // The page re-renders from the server to show the new status, pin or lock
            moderation={
                isModerator
                    ? { status: post.status, pinned: Boolean(post.pinned_at), canPin: true, onModerated: () => router.refresh() }
                    : undefined
            }
        />
    );
}
