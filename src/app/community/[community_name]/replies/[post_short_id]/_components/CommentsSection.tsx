'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SortByDropdown } from './SortByDropdown';
import TimeUtility from '@/lib/utils/TimeUtility';
import Button from '@/components/ui/Button';
import { ChevronDown } from 'lucide-react';
import { ReplyActions } from './ReplyActions';
import { usePOST } from '@/hooks/usePOST';
import { useFetch } from '@/hooks/useFetch';
import { APIUtility } from '@/lib/utils/APIUtility';
import ContentReplySection from './ContentReplySection';
import { Comment, CommentsResponse, CreateCommentResponse } from '@/types/api';

// Placeholder until avatars are wired to avatar_id
const AVATAR_PLACEHOLDER = '/profile-pic-1.jpeg';
const MORE_REPLIES_LIMIT = 50;

interface ThreadContext {
    postId: string;
    postShortId: string;
    communityName: string;
}

export function CommentsSection({
    initialComments,
    postId,
    postShortId,
    communityName,
}: {
    initialComments: Comment[];
} & ThreadContext) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [resetReplyContent, setResetReplyContent] = useState(false);
    const { sendData } = usePOST<CreateCommentResponse>();
    const thread: ThreadContext = { postId, postShortId, communityName };

    async function handleTopLevelReply(replyContent: string) {
        setResetReplyContent(false);
        const result = await sendData(`${APIUtility.getApiUrl()}/comment/create`, {
            post_id: postId,
            content: replyContent,
            is_anonymous: false,
        });

        if (result?.comment) {
            setComments((current) => [result.comment, ...current]);
            setResetReplyContent(true);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <ContentReplySection handleReply={handleTopLevelReply} resetReplyContent={resetReplyContent} />

            <div className="flex items-center gap-1 text-sm">
                <p>Sort by:</p>
                <SortByDropdown buttonZIndex="z-10" filter="top" />
            </div>

            <div className="flex flex-col w-full py-4 gap-2">
                {comments.map((comment) => (
                    <CommentBlock key={comment.id} initialComment={comment} thread={thread} />
                ))}
            </div>
        </div>
    );
}

// The API drops author_ref for anonymous, deleted and removed comments
function getAuthorName(comment: Comment): string {
    if (comment.author_ref?.username) return comment.author_ref.username;
    return comment.status === 'deleted' || comment.status === 'removed' ? '[deleted]' : 'Anonymous';
}

function CommentBlock({ initialComment, thread }: { initialComment: Comment; thread: ThreadContext }) {
    const [comment, setComment] = useState<Comment>(initialComment);
    const [isReplying, setIsReplying] = useState(false);
    const [isExpanded, setIsExpanded] = useState((initialComment.child_comments?.length ?? 0) > 0);
    const [resetReplyContent, setResetReplyContent] = useState(false);

    const { sendData: sendReply } = usePOST<CreateCommentResponse>();
    const { fetchData: fetchReplies, isLoading: isLoadingReplies } = useFetch<CommentsResponse>();

    const childComments = comment.child_comments ?? [];
    const totalReplies = comment._count?.child_comments ?? 0;
    const hasChildren = totalReplies > 0;
    const hiddenReplies = Math.max(totalReplies - childComments.length, 0);

    async function loadMoreReplies() {
        const params = new URLSearchParams({ parent_limit: String(MORE_REPLIES_LIMIT) });
        const url = `${APIUtility.getApiUrl()}/community/${thread.communityName}/replies/${thread.postShortId}/reply/${comment.short_id}?${params}`;
        const result = await fetchReplies(url);

        if (result?.comments) {
            setComment((current) => ({ ...current, child_comments: result.comments }));
        }
    }

    async function showReplies() {
        setIsExpanded(true);
        if (hiddenReplies > 0) {
            await loadMoreReplies();
        }
    }

    function hideReplies() {
        setIsExpanded(false);
    }

    function toggleReplyMode() {
        setIsReplying(!isReplying);
    }

    async function handleReply(replyContent: string) {
        setResetReplyContent(false);
        const result = await sendReply(`${APIUtility.getApiUrl()}/comment/create`, {
            post_id: thread.postId,
            content: replyContent,
            is_anonymous: false,
            parent_comment_id: comment.id,
        });

        if (result?.comment) {
            const newReply = result.comment;
            setComment((current) => ({
                ...current,
                child_comments: [newReply, ...(current.child_comments ?? [])],
                _count: { ...current._count, child_comments: (current._count?.child_comments ?? 0) + 1 },
            }));
            setIsExpanded(true);
            setIsReplying(false);
            setResetReplyContent(true);
        }
    }

    return (
        <div className="flex gap-4 w-full">
            <ShapeSection
                username={getAuthorName(comment)}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                toggleHideAllReplies={hideReplies}
            />

            <div className="flex flex-col gap-5 w-full">
                <div className="flex flex-col gap-1.5 w-full">
                    <TextSection comment={comment} />

                    <ReplyActions
                        buttonZIndex="z-10"
                        upvotes={comment._count?.upvoters ?? 0}
                        downvotes={comment._count?.downvoters ?? 0}
                        toggleReplyMode={toggleReplyMode}
                    />

                    {isReplying && (
                        <ContentReplySection
                            fromReply={true}
                            toggleReplyMode={toggleReplyMode}
                            handleReply={handleReply}
                            resetReplyContent={resetReplyContent}
                        />
                    )}
                </div>

                {/* Child replies */}
                {isExpanded &&
                    childComments.map((childComment) => (
                        <CommentBlock key={childComment.id} initialComment={childComment} thread={thread} />
                    ))}

                {hasChildren && (
                    <div className="flex items-center gap-1">
                        {(!isExpanded || hiddenReplies > 0) && (
                            <Button
                                onClick={showReplies}
                                size="round"
                                variant="transparent"
                                className="w-fit px-3"
                                disabled={isLoadingReplies}
                            >
                                <span className="flex items-center gap-1">
                                    {isExpanded ? `${hiddenReplies} more` : totalReplies}{' '}
                                    {(isExpanded ? hiddenReplies : totalReplies) === 1 ? 'reply' : 'replies'}{' '}
                                    <ChevronDown className="size-4" />
                                </span>
                            </Button>
                        )}
                        {isExpanded && (
                            <Button size="round" variant="transparent" className="w-fit px-3" onClick={hideReplies}>
                                Hide replies
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ShapeSection({
    username,
    hasChildren,
    isExpanded,
    toggleHideAllReplies,
}: {
    username: string;
    hasChildren: boolean;
    isExpanded: boolean;
    toggleHideAllReplies: () => void;
}) {
    const alt = `${username}'s avatar`;
    return (
        <div className="flex flex-col items-center gap-0">
            <div className="relative size-10 shrink-0 rounded-full overflow-hidden aspect-square">
                <Image src={AVATAR_PLACEHOLDER} className="object-cover" alt={alt} fill sizes="40px" />
            </div>

            {hasChildren && isExpanded && (
                <div
                    onClick={toggleHideAllReplies}
                    className="w-full h-full flex flex-col group items-center justify-center"
                >
                    <div className="w-px flex-1 bg-gray-300 group-hover:bg-gray-400 transition-colors duration-75 ease-in-out" />
                </div>
            )}
        </div>
    );
}

function TitleSection({
    username,
    createdAt,
    editedAt,
}: {
    username: string;
    createdAt: string;
    editedAt: string | null;
}) {
    return (
        <div className="flex items-center gap-1 font-light text-sm">
            <span className="font-medium">{username}</span>
            <span>•</span>
            <span>{TimeUtility.formatTimeAgo(createdAt)}</span>
            {editedAt && (
                <>
                    <span>•</span>
                    <span>Edited</span>
                    <span>{TimeUtility.formatTimeAgo(editedAt)}</span>
                </>
            )}
        </div>
    );
}

function TextSection({ comment }: { comment: Comment }) {
    return (
        <div className="flex flex-col gap-1.5">
            <TitleSection
                username={getAuthorName(comment)}
                createdAt={comment.created_at}
                editedAt={comment.is_edited ? comment.edited_at : null}
            />
            <p className="font-normal whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
    );
}
