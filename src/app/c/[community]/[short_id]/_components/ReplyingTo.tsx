import Link from 'next/link';
import { CornerDownRight } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import Markdown from '@/components/common/Markdown';
import TimeUtility from '@/lib/utils/TimeUtility';
import { Comment } from '@/types/api';
import { getAuthorName, shownAvatar } from './commentAuthor';

// The comment a focused reply answers, shown above it in the single-comment view (opened from Notifications, say) so
// the reply makes sense without going to All comments. Rendered on the server, so it adds no JavaScript.
export default function ReplyingTo({ parent, href }: { parent: Comment; href: string }) {
    const isGone = parent.status === 'deleted' || parent.status === 'removed';
    return (
        <div className="mb-3">
            <p className="mb-1.5 flex items-center gap-1 text-[13px] text-muted">
                <CornerDownRight className="size-3.5" aria-hidden /> Replying to
            </p>
            <div className="relative rounded-[10px] border border-border px-3.5 py-2.5 transition-colors hover:bg-active">
                {/* The whole card opens the parent's thread; links in the text sit above this (z-10 in Markdown) */}
                <Link href={href} aria-label={`Open ${getAuthorName(parent)}'s comment`} className="absolute inset-0 rounded-[10px]" />
                <span className="flex items-center gap-2 text-[13px]">
                    <UserAvatar user={shownAvatar(parent)} size={20} className="size-5" />
                    <span className="truncate font-semibold text-text">{getAuthorName(parent)}</span>
                    <span aria-hidden className="text-subtle">·</span>
                    <time dateTime={parent.created_at} suppressHydrationWarning className="shrink-0 text-subtle">
                        {TimeUtility.formatTimeAgo(parent.created_at)}
                    </time>
                </span>
                {isGone ? (
                    <p className="mt-1 text-sm italic text-muted">{parent.body}</p>
                ) : (
                    <Markdown text={parent.body} className="mt-1 line-clamp-4 text-sm leading-[21px] text-body" />
                )}
            </div>
        </div>
    );
}
