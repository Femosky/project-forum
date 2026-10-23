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
        <Button asChild variant="secondary" size="sm" className="relative z-10 h-8 text-sm">
            <Link href={href}>
                <MessageCircle className="size-4" />
                <span className="tabular-nums">{NumberUtility.compactFormatter.format(count)}</span>
                <span className="sr-only">{count === 1 ? 'comment' : 'comments'}</span>
            </Link>
        </Button>
    );
}

// The post's "..." menu. Deleting from the post page goes back to the community; from a list it drops out.
export function PostOptions({ post, leaveOnDelete }: { post: Post; leaveOnDelete: boolean }) {
    const router = useRouter();

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
        />
    );
}
