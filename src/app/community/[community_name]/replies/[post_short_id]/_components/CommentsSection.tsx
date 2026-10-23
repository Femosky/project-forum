'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SortByDropdown } from './SortByDropdown';
import TimeUtility from '@/lib/utils/TimeUtility';
import Button from '@/components/ui/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReplyActions } from './ReplyActions';
import { usePOST } from '@/hooks/usePOST';
import { APIUtility } from '@/lib/utils/APIUtility';
import { TextArea } from '@/components/ui/TextArea';
import ContentReplySection from './ContentReplySection';

export function CommentsSection({ initialComments }: { initialComments: unknown[] }) {
    const [comments, setComments] = useState(initialComments);

    // function handleSort(sort: string) {
    //     setComments(comments.sort((a, b) => {
    //         return a.created_at - b.created_at;
    //     }))
    // }

    return (
        <div>
            <div className="flex items-center gap-1 text-sm">
                <p>Sort by:</p>
                <SortByDropdown buttonZIndex="z-10" filter="top" />
            </div>

            <div className="flex flex-col w-full py-4 gap-2 border border-gray-200">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <CommentsBlock initialComments={comments} />
            </div>
        </div>
    );
}

// The API drops author_ref for anonymous, deleted and removed comments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAuthorName(comment: any): string {
    if (comment.author_ref?.username) return comment.author_ref.username;
    return comment.status === 'deleted' || comment.status === 'removed' ? '[deleted]' : 'Anonymous';
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function CommentsBlock({ initialComments }: { initialComments: any[] }) {
    const [comments, setComments] = useState(initialComments);

    function handleReplyUpdate(parentCommentId: string, updatedComment: any) {
        const newComments = [...comments];

        for (let i = 0; i < newComments.length; i++) {
            const comment = newComments[i];

            if (comment.id === parentCommentId) {
                newComments[i] = { ...comment, ...updatedComment };
                break;
            }
        }

        setComments(newComments);
    }

    function getDefaultChildrenOpenCount(comment: any): number {
        return (comment?.child_comments?.length ?? 0) > 0 ? 1 : 0;
    }

    return (
        <>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {comments.filter(Boolean).map((comment: any) => {
                return (
                    <CommentBlock
                        key={comment.id}
                        initialComment={comment}
                        defaultChildrenOpenCount={getDefaultChildrenOpenCount(comment)}
                        handleReplyUpdate={handleReplyUpdate}
                    />
                );
            })}
        </>
    );
}

function CommentBlock({
    initialComment,
    defaultChildrenOpenCount,
    handleReplyUpdate,
}: {
    initialComment: any;
    defaultChildrenOpenCount: number;
    handleReplyUpdate: (parentCommentId: string, updatedComment: any) => void;
}) {
    const [comment, setComment] = useState(initialComment);
    const [isReplying, setIsReplying] = useState(false);
    const hasChildren = (comment?._count?.child_comments ?? 0) > 0;
    const [isExpanded, setIsExpanded] = useState(hasChildren);
    const [resetReplyContent, setResetReplyContent] = useState(false);

    const { data: replyData, sendData: sendReplyData, reset: resetReplyData } = usePOST();
    const { data: moreRepliesData, sendData: sendMoreRepliesData, reset: resetMoreRepliesData } = usePOST();

    const [childrenOpenCount, setChildrenOpenCount] = useState<number>(defaultChildrenOpenCount);

    function handleChildRepliesUpdate(newChildComments: any[]) {
        const newComment = { ...comment };
        newComment.child_comments = [...comment.child_comments, ...newChildComments];
        setComment(newComment);
    }

    async function fetchMoreReplies() {
        // /:community_name/replies/:post_short_id/reply/:comment_short_id
        // const params = new URLSearchParams({
        //     sort_by = CommentService.DEFAULT_SORT_BY,
        //     parent_page_number = CommentService.DEFAULT_PAGE_NUMBER,
        //     parent_limit = CommentService.DEFAULT_LIMIT,
        // });

        const payload = {};
        const url = `${APIUtility.getApiUrl()}/community/${comment.community_name}/replies/${comment.short_id}/reply/${comment.short_id}`;
        await sendMoreRepliesData(url, payload);
    }

    async function toggleExpand() {
        if (comment.child_comments.length < (parseInt(comment?._count?.child_comments) ?? 0)) {
            // Fetch more replies
            await fetchMoreReplies();
            setIsExpanded(true);
        }
        // setChildrenOpenCount(Math.max((parseInt(comment?._count?.child_comments) ?? 0) - childrenOpenCount, 0));
    }

    function toggleHideAllReplies() {
        setChildrenOpenCount(comment._count.child_comments);
        setIsExpanded(false);
    }

    function toggleReplyMode() {
        setIsReplying(!isReplying);
    }

    async function handleReply(replyContent: string) {
        // { community_id, post_id, content, is_anonymous, is_sponsored, parent_comment_id }

        const payload = {
            post_id: comment.post_id,
            content: replyContent,
            is_anonymous: false,
            parent_comment_id: comment.parent_comment_id,
        };

        await sendReplyData(`${APIUtility.getApiUrl()}/comment/create`, payload);

        setIsReplying(false);
        setResetReplyContent(true);
    }

    useEffect(() => {
        if (moreRepliesData) {
            console.log('more replies data: ', moreRepliesData);

            // Update the comments with the new replies
            handleChildRepliesUpdate(comment.id, moreRepliesData.comments);
            resetMoreRepliesData();
        }
    }, [moreRepliesData]);

    useEffect(() => {
        if (replyData) {
            console.log('reply data: ', replyData);
            handleReplyUpdate(comment.id, replyData);
            resetReplyData();
        }
    }, [replyData]);

    return (
        <div className="flex gap-4 w-full">
            <ShapeSection
                username={getAuthorName(comment)}
                avatarId={comment.author_ref?.avatar_id ?? 'default_1'}
                hasChildren={hasChildren}
                parentCommentId={comment.parent_comment_id}
                isExpanded={isExpanded}
                toggleHideAllReplies={toggleHideAllReplies}
            />

            <div className="flex flex-col gap-5 w-full">
                <div className="flex flex-col gap-1.5 w-full">
                    <TextSection comment={comment} />

                    <ReplyActions
                        buttonZIndex="z-10"
                        upvotes={comment._count.upvoters}
                        downvotes={comment._count.downvoters}
                        toggleReplyMode={toggleReplyMode}
                    />

                    {isReplying && (
                        <ContentReplySection
                            fromReply={true}
                            toggleReplyMode={toggleReplyMode}
                            handleReply={(replyContent) => handleReply(replyContent)}
                            resetReplyContent={resetReplyContent}
                        />
                    )}
                </div>

                {/* Child replies */}
                {defaultChildrenOpenCount > 0 &&
                    isExpanded &&
                    comment?.child_comments &&
                    comment.child_comments.length > 0 &&
                    comment.child_comments.map((childComment: any) => {
                        return (
                            <CommentBlock
                                key={childComment.id}
                                initialComment={childComment}
                                defaultChildrenOpenCount={childrenOpenCount}
                                handleCommentUpdate={handleCommentUpdate}
                            />
                        );
                    })}

                {/* TODO: add expand/hide all replies button */}
                {hasChildren && (
                    <div className="flex items-center gap-1">
                        {!isExpanded && childrenOpenCount > 0 && (
                            <Button onClick={toggleExpand} size="round" variant="transparent" className="w-fit px-3">
                                <span className="flex items-center gap-1">
                                    {childrenOpenCount} replies <ChevronDown className="size-4" />
                                </span>
                            </Button>
                        )}
                        {isExpanded && (
                            <Button
                                size="round"
                                variant="transparent"
                                className="w-fit px-3"
                                onClick={toggleHideAllReplies}
                            >
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
    avatarId,
    hasChildren,
    parentCommentId,
    isExpanded,
    toggleHideAllReplies,
}: {
    username: string;
    avatarId: string;
    hasChildren: boolean;
    parentCommentId: string | null;
    isExpanded: boolean;
    toggleHideAllReplies: () => void;
}) {
    const imgTestUrl =
        'https://firebasestorage.googleapis.com:443/v0/b/roki-e02bf.appspot.com/o/profilesMedia%2F06RrzyKlNEQl192x861CKZslf223%2FD56331C9-BFF0-40B6-BD69-480F206F5017.jpg?alt=media&token=7b1d07df-8f8d-4dc9-99ee-a4942a8d7e5d';

    const alt = `${username}'s avatar`;
    return (
        <div className="flex flex-col items-center gap-0 xbg-amber-100">
            <div className="relative size-10 shrink-0 rounded-full overflow-visible aspect-square">
                {/* {parentCommentId !== null && (
                    <div className="absolute flex items-center right-full size-9 apointer-events-none">
                        <div className="w-full h-px bg-gray-300" />
                    </div>
                )} */}
                <div className="relative size-10 shrink-0 rounded-full overflow-hidden aspect-square">
                    <Image
                        src={imgTestUrl}
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={imgTestUrl}
                        alt={alt}
                        fill
                    />
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div
                    onClick={toggleHideAllReplies}
                    className="w-full h-full flex flex-col group items-center justify-center"
                >
                    <div className="w-px flex-1 bg-gray-300 group-hover:bg-gray-400 transition-colors duration-75 ease-in-ou" />
                </div>
            )}
        </div>
    );
}

function TitleSection({
    username,
    createdAt,
    isEdited,
    editedAt,
}: {
    username: string;
    createdAt: string;
    isEdited: boolean;
    editedAt: string;
}) {
    return (
        <div className="flex items-center gap-1 font-light text-sm">
            <span className="font-medium">{username}</span>
            <span>•</span>
            <span>{TimeUtility.formatTimeAgo(createdAt)}</span>
            {isEdited && editedAt && (
                <>
                    <span>•</span>
                    <span>Edited</span>
                    <span>{TimeUtility.formatTimeAgo(editedAt)}</span>
                </>
            )}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TextSection({ comment }: { comment: any }) {
    const username = getAuthorName(comment);
    const createdAt = comment.created_at;
    const isEdited = comment.edited_at;
    const editedAt = comment.edited_at;

    return (
        <div className="flex flex-col gap-1.5">
            <TitleSection username={username} createdAt={createdAt} isEdited={isEdited} editedAt={editedAt} />
            <p className="font-normal">
                {comment.content !== 'Me too!'
                    ? comment.content
                    : 'jnjsnjs jfnjsnfjs f sjnfjs fjs jfsjf sj fsjfjs fjs fsj fjsnfs fjs fjsfnisnfjs fjsn fjsn fjsnfisjfjnjsnjs jfnjsnfjs f sjnfjs fjs jfsjf sj fsjfjs fjs fsj fjsnfs fjs fjsfnisnfjs fjsn fjsn fjsnfisjfjnjsnjs jfnjsnfjs f sjnfjs fjs jfsjf sj fsjfjs fjs fsj fjsnfs fjs fjsfnisnfjs fjsn fjsn fjsnfisjfjnjsnjs jfnjsnfjs f sjnfjs fjs jfsjf sj fsjfjs fjs fsj fjsnfs fjs fjsfnisnfjs fjsn fjsn fjsnfisjfjnjsnjs jfnjsnfjs f sjnfjs fjs jfsjf sj fsjfjs fjs fsj fjsnfs fjs fjsfnisnfjs fjsn fjsn fjsnfisjfjnjsnjs jfnjsnfjs f sjnfjs fjs jfsjf sj fsjfjs fjs fsj fjsnfs fjs fjsfnisnfjs fjsn fjsn fjsnfisjfjnjsnjs jfnjsnfjs f sjnfjs fjs jfsjf sj fsjfjs fjs fsj fjsnfs fjs fjsfnisnfjs fjsn fjsn fjsnfisjfjnjsnjs jfnjsnfjs f sjnfjs fjs jfsjf sj fsjfjs fjs fsj fjsnfs fjs fjsfnisnfjs fjsn fjsn fjsnfisjfjnjsnjs jfnjsnfjs f sjnfjs fjs jfsjf sj fsjfjs fjs fsj fjsnfs fjs fjsfnisnfjs fjsn fjsn fjsnfisjf'}
            </p>
        </div>
    );
}
